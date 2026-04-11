import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import GenLib "../lib/generation";
import Common "../types/common";
import Types "../types/generation";

mixin (
  accessControlState : AccessControl.AccessControlState,
  generations : Map.Map<Common.GenerationId, Types.Generation>,
  userProfiles : Map.Map<Common.UserId, Types.UserProfile>,
  nextId : { var value : Common.GenerationId },
) {
  // Required transform callback for HTTP outcalls
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Call Groq API to generate an app design and return structured result
  public shared ({ caller }) func generateApp(prompt : Text) : async Types.GenerationResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to generate apps");
    };

    let groqPrompt = GenLib.buildGroqPrompt(prompt);

    let requestBody = "{" #
      "\"model\": \"llama3-8b-8192\"," #
      "\"messages\": [{\"role\": \"user\", \"content\": " # jsonStringEscape(groqPrompt) # "}]," #
      "\"temperature\": 0.7," #
      "\"max_tokens\": 2048" #
      "}";

    let groqApiKey = "gsk_placeholder_replace_with_real_key";

    let headers : [OutCall.Header] = [
      { name = "Content-Type"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # groqApiKey },
    ];

    let responseText = await OutCall.httpPostRequest(
      "https://api.groq.com/openai/v1/chat/completions",
      headers,
      requestBody,
      transform,
    );

    // Extract the "content" field from the Groq response
    let content = extractGroqContent(responseText);
    GenLib.parseGenerationResult(content);
  };

  // Save a generation to the store
  public shared ({ caller }) func saveGeneration(
    prompt : Text,
    overview : Types.Overview,
    architecture : Types.Architecture,
    codeSnippets : [Types.CodeSnippet],
  ) : async { #ok : Common.GenerationId; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in to save generations");
    };

    let id = nextId.value;
    nextId.value += 1;

    let result : Types.GenerationResult = { overview; architecture; codeSnippets };
    let gen = GenLib.newGeneration(id, caller, prompt, result, Time.now());
    generations.add(id, gen);
    #ok(id)
  };

  // List all generations belonging to the caller
  public query ({ caller }) func getMyGenerations() : async [Types.GenerationSummary] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    GenLib.listForUser(generations, caller)
  };

  // Get a specific generation — only owner or admin can view
  public query ({ caller }) func getGeneration(id : Common.GenerationId) : async ?Types.Generation {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (GenLib.getById(generations, id)) {
      case null null;
      case (?gen) {
        if (Principal.equal(gen.userId, caller) or AccessControl.isAdmin(accessControlState, caller)) {
          ?gen
        } else {
          Runtime.trap("Unauthorized: Can only view your own generations");
        };
      };
    };
  };

  // Delete a generation — only owner can delete
  public shared ({ caller }) func deleteGeneration(id : Common.GenerationId) : async { #ok; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    switch (GenLib.deleteOwned(generations, id, caller)) {
      case (#ok) #ok;
      case (#notFound) #err("Generation not found");
      case (#unauthorized) #err("Unauthorized: Can only delete your own generations");
    };
  };

  // Get the caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?Types.UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller)
  };

  // Save the caller's own profile
  public shared ({ caller }) func saveCallerUserProfile(profile : Types.UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  // Get another user's profile (caller must be same user or admin)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?Types.UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user)
  };

  // Escape a text value for inclusion as a JSON string literal
  func jsonStringEscape(text : Text) : Text {
    var result = "";
    for (c in text.toIter()) {
      let code = c.toNat32();
      if (code == 34) { result := result # "\\\"" }       // '"'
      else if (code == 92) { result := result # "\\\\" }  // '\'
      else if (code == 10) { result := result # "\\n" }   // newline
      else if (code == 13) { result := result # "\\r" }   // carriage return
      else if (code == 9) { result := result # "\\t" }    // tab
      else { result := result # Text.fromChar(c) };
    };
    "\"" # result # "\""
  };

  // Extract the assistant message content from a Groq chat completions response
  func extractGroqContent(responseJson : Text) : Text {
    // Look for: "content":"<value>"
    // The field appears inside choices[0].message.content
    let key = "\"content\":";
    let hArr = responseJson.toArray();
    let nArr = key.toArray();
    let hSize = hArr.size();
    let nSize = nArr.size();

    var i = 0;
    while (i + nSize <= hSize) {
      var j = 0;
      var match = true;
      while (j < nSize) {
        if (hArr[i + j] != nArr[j]) match := false;
        j += 1;
      };
      if (match) {
        // Skip whitespace after key
        var k = i + nSize;
        while (k < hSize and (
          hArr[k].toNat32() == 32 or   // space
          hArr[k].toNat32() == 10 or   // newline
          hArr[k].toNat32() == 13 or   // carriage return
          hArr[k].toNat32() == 9        // tab
        )) {
          k += 1;
        };
        if (k < hSize and hArr[k].toNat32() == 34) {  // '"'
          // Extract quoted string
          k += 1;
          let buf = List.empty<Char>();
          var escaped = false;
          while (k < hSize) {
            let c = hArr[k];
            let code = c.toNat32();
            if (escaped) {
              if (code == 110) { buf.add(Char.fromNat32(10)) }       // 'n' -> newline
              else if (code == 114) { buf.add(Char.fromNat32(13)) }  // 'r' -> carriage return
              else if (code == 116) { buf.add(Char.fromNat32(9)) }   // 't' -> tab
              else { buf.add(c) };
              escaped := false;
            } else if (code == 92) {  // '\'
              escaped := true;
            } else if (code == 34) {  // '"'
              k := hSize; // break
            } else {
              buf.add(c);
            };
            k += 1;
          };
          return Text.fromIter(buf.values());
        };
      };
      i += 1;
    };
    // Fallback: return raw response if content not found
    responseJson
  };
};
