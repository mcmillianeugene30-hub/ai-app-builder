import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Principal "mo:core/Principal";
import Common "../types/common";
import Types "../types/generation";

module {
  // Build a structured Groq prompt requesting JSON output
  public func buildGroqPrompt(userPrompt : Text) : Text {
    "You are an expert full-stack app architect. A user wants to build the following app:\n\n" #
    userPrompt #
    "\n\nRespond ONLY with a JSON object (no markdown, no explanation) matching this exact schema:\n" #
    "{\n" #
    "  \"overview\": {\n" #
    "    \"concept\": \"<one sentence describing the app>\",\n" #
    "    \"targetUsers\": \"<who will use this app>\",\n" #
    "    \"keyFeatures\": [\"<feature 1>\", \"<feature 2>\", \"<feature 3>\"]\n" #
    "  },\n" #
    "  \"architecture\": {\n" #
    "    \"systemDesign\": \"<describe the overall system design>\",\n" #
    "    \"techStack\": [\"<tech 1>\", \"<tech 2>\", \"<tech 3>\"],\n" #
    "    \"dataFlow\": \"<describe how data flows through the system>\"\n" #
    "  },\n" #
    "  \"codeSnippets\": [\n" #
    "    { \"filename\": \"<filename>\", \"code\": \"<code content>\" },\n" #
    "    { \"filename\": \"<filename>\", \"code\": \"<code content>\" }\n" #
    "  ]\n" #
    "}"
  };

  // ─── Internal JSON helpers ──────────────────────────────────────────────────

  // Char code constants
  let DQUOTE  : Nat32 = 34;  // "
  let BSLASH  : Nat32 = 92;  // \
  let SPACE   : Nat32 = 32;  // space
  let NEWLINE : Nat32 = 10;  // \n
  let CR      : Nat32 = 13;  // \r
  let TAB     : Nat32 = 9;   // \t
  let LBRACE  : Nat32 = 123; // {
  let RBRACE  : Nat32 = 125; // }
  let LBRACK  : Nat32 = 91;  // [
  let RBRACK  : Nat32 = 93;  // ]
  let COMMA   : Nat32 = 44;  // ,
  let N_LOWER : Nat32 = 110; // n
  let R_LOWER : Nat32 = 114; // r
  let T_LOWER : Nat32 = 116; // t

  func isWs(code : Nat32) : Bool {
    code == SPACE or code == NEWLINE or code == CR or code == TAB
  };

  // Find the index of needle in haystack chars, starting at fromIdx
  func findNeedle(hArr : [Char], nArr : [Char], fromIdx : Nat) : ?Nat {
    let hSize = hArr.size();
    let nSize = nArr.size();
    if (nSize == 0) return ?fromIdx;
    var i = fromIdx;
    while (i + nSize <= hSize) {
      var j = 0;
      var matched = true;
      while (j < nSize) {
        if (hArr[i + j] != nArr[j]) { matched := false };
        j += 1;
      };
      if (matched) return ?i;
      i += 1;
    };
    null
  };

  // Skip whitespace starting at index idx
  func skipWs(arr : [Char], idx : Nat) : Nat {
    var i = idx;
    while (i < arr.size() and isWs(arr[i].toNat32())) {
      i += 1;
    };
    i
  };

  // Read a quoted JSON string starting at arr[idx] (which must be '"')
  // Returns (parsed_text, next_index_after_closing_quote)
  func readQuotedString(arr : [Char], idx : Nat) : (Text, Nat) {
    let buf = List.empty<Char>();
    var i = idx + 1; // skip opening quote
    var escaped = false;
    label strLoop while (i < arr.size()) {
      let c = arr[i];
      let code = c.toNat32();
      if (escaped) {
        if (code == N_LOWER) { buf.add(Char.fromNat32(NEWLINE)) }
        else if (code == R_LOWER) { buf.add(Char.fromNat32(CR)) }
        else if (code == T_LOWER) { buf.add(Char.fromNat32(TAB)) }
        else { buf.add(c) };
        escaped := false;
      } else if (code == BSLASH) {
        escaped := true;
      } else if (code == DQUOTE) {
        i += 1;
        break strLoop;
      } else {
        buf.add(c);
      };
      i += 1;
    };
    (Text.fromIter(buf.values()), i)
  };

  // Extract value of a string field by key name from a JSON object text
  func extractStringField(json : Text, fieldName : Text) : Text {
    let arr = json.toArray();
    let key = ("\"" # fieldName # "\":").toArray();
    switch (findNeedle(arr, key, 0)) {
      case null "";
      case (?pos) {
        let valStart = skipWs(arr, pos + key.size());
        if (valStart < arr.size() and arr[valStart].toNat32() == DQUOTE) {
          let (s, _) = readQuotedString(arr, valStart);
          s
        } else "";
      };
    };
  };

  // Extract a JSON array of strings for a given key from JSON object text
  func extractStringArray(json : Text, fieldName : Text) : [Text] {
    let arr = json.toArray();
    let key = ("\"" # fieldName # "\":").toArray();
    switch (findNeedle(arr, key, 0)) {
      case null [];
      case (?pos) {
        let valStart = skipWs(arr, pos + key.size());
        if (valStart < arr.size() and arr[valStart].toNat32() == LBRACK) {
          readStringArray(arr, valStart)
        } else [];
      };
    };
  };

  // Read a JSON array of strings starting at arr[idx] (which must be '[')
  func readStringArray(arr : [Char], startIdx : Nat) : [Text] {
    let result = List.empty<Text>();
    var i = startIdx + 1; // skip '['
    label arrLoop while (i < arr.size()) {
      i := skipWs(arr, i);
      if (i >= arr.size()) break arrLoop;
      let code = arr[i].toNat32();
      if (code == RBRACK) break arrLoop;
      if (code == DQUOTE) {
        let (s, next) = readQuotedString(arr, i);
        result.add(s);
        i := skipWs(arr, next);
        if (i < arr.size() and arr[i].toNat32() == COMMA) i += 1;
      } else {
        i += 1;
      };
    };
    result.toArray()
  };

  // Extract a JSON sub-object string starting at the value of fieldName
  func extractObject(json : Text, fieldName : Text) : Text {
    let arr = json.toArray();
    let key = ("\"" # fieldName # "\":").toArray();
    switch (findNeedle(arr, key, 0)) {
      case null "{}";
      case (?pos) {
        let valStart = skipWs(arr, pos + key.size());
        if (valStart < arr.size() and arr[valStart].toNat32() == LBRACE) {
          let (objText, _) = readJsonObject(arr, valStart);
          objText
        } else "{}";
      };
    };
  };

  // Read a JSON object starting at arr[idx] (which must be '{')
  // Returns (text_of_object, next_index)
  func readJsonObject(arr : [Char], startIdx : Nat) : (Text, Nat) {
    let buf = List.empty<Char>();
    var i = startIdx;
    var depth = 0;
    var inStr = false;
    var esc = false;
    label objLoop while (i < arr.size()) {
      let c = arr[i];
      let code = c.toNat32();
      buf.add(c);
      if (esc) {
        esc := false;
      } else if (inStr) {
        if (code == BSLASH) { esc := true }
        else if (code == DQUOTE) { inStr := false };
      } else {
        if (code == DQUOTE) { inStr := true }
        else if (code == LBRACE) { depth += 1 }
        else if (code == RBRACE) {
          depth -= 1;
          if (depth == 0) {
            i += 1;
            break objLoop;
          };
        };
      };
      i += 1;
    };
    (Text.fromIter(buf.values()), i)
  };

  // Extract array of CodeSnippet objects from JSON
  func extractCodeSnippets(json : Text) : [Types.CodeSnippet] {
    let arr = json.toArray();
    let key = ("\"codeSnippets\":").toArray();
    switch (findNeedle(arr, key, 0)) {
      case null [];
      case (?pos) {
        let valStart = skipWs(arr, pos + key.size());
        if (valStart < arr.size() and arr[valStart].toNat32() == LBRACK) {
          readCodeSnippetArray(arr, valStart)
        } else [];
      };
    };
  };

  func readCodeSnippetArray(arr : [Char], startIdx : Nat) : [Types.CodeSnippet] {
    let result = List.empty<Types.CodeSnippet>();
    var i = startIdx + 1; // skip '['
    label arrLoop while (i < arr.size()) {
      i := skipWs(arr, i);
      if (i >= arr.size()) break arrLoop;
      let code = arr[i].toNat32();
      if (code == RBRACK) break arrLoop;
      if (code == LBRACE) {
        let (objText, next) = readJsonObject(arr, i);
        let filename = extractStringField(objText, "filename");
        let codeStr = extractStringField(objText, "code");
        result.add({ filename; code = codeStr });
        i := skipWs(arr, next);
        if (i < arr.size() and arr[i].toNat32() == COMMA) i += 1;
      } else {
        i += 1;
      };
    };
    result.toArray()
  };

  // ─── Public API ─────────────────────────────────────────────────────────────

  // Parse the raw JSON response from Groq into a GenerationResult
  public func parseGenerationResult(jsonText : Text) : Types.GenerationResult {
    let overviewJson = extractObject(jsonText, "overview");
    let concept = extractStringField(overviewJson, "concept");
    let targetUsers = extractStringField(overviewJson, "targetUsers");
    let keyFeatures = extractStringArray(overviewJson, "keyFeatures");

    let overview : Types.Overview = {
      concept = if (concept == "") "An application based on your description" else concept;
      targetUsers = if (targetUsers == "") "General users" else targetUsers;
      keyFeatures = if (keyFeatures.size() == 0) ["Core functionality", "User-friendly interface", "Data persistence"] else keyFeatures;
    };

    let archJson = extractObject(jsonText, "architecture");
    let systemDesign = extractStringField(archJson, "systemDesign");
    let techStack = extractStringArray(archJson, "techStack");
    let dataFlow = extractStringField(archJson, "dataFlow");

    let architecture : Types.Architecture = {
      systemDesign = if (systemDesign == "") "A full-stack application with frontend and backend components" else systemDesign;
      techStack = if (techStack.size() == 0) ["React", "TypeScript", "Motoko"] else techStack;
      dataFlow = if (dataFlow == "") "User interactions trigger frontend events that call backend canister methods" else dataFlow;
    };

    let codeSnippets = extractCodeSnippets(jsonText);

    { overview; architecture; codeSnippets }
  };

  public func newGeneration(
    id : Common.GenerationId,
    userId : Common.UserId,
    prompt : Text,
    result : Types.GenerationResult,
    createdAt : Common.Timestamp,
  ) : Types.Generation {
    {
      id;
      userId;
      prompt;
      overview = result.overview;
      architecture = result.architecture;
      codeSnippets = result.codeSnippets;
      createdAt;
    }
  };

  public func toSummary(gen : Types.Generation) : Types.GenerationSummary {
    let arr = gen.prompt.toArray();
    let preview = if (arr.size() > 100) {
      let truncBuf = List.empty<Char>();
      var i = 0;
      while (i < 100) {
        truncBuf.add(arr[i]);
        i += 1;
      };
      Text.fromIter(truncBuf.values()) # "..."
    } else {
      gen.prompt
    };
    { id = gen.id; promptPreview = preview; createdAt = gen.createdAt }
  };

  public func listForUser(
    generations : Map.Map<Common.GenerationId, Types.Generation>,
    userId : Common.UserId,
  ) : [Types.GenerationSummary] {
    let result = List.empty<Types.GenerationSummary>();
    for ((_, gen) in generations.entries()) {
      if (Principal.equal(gen.userId, userId)) {
        result.add(toSummary(gen));
      };
    };
    result.toArray()
  };

  public func getById(
    generations : Map.Map<Common.GenerationId, Types.Generation>,
    id : Common.GenerationId,
  ) : ?Types.Generation {
    generations.get(id)
  };

  public func deleteOwned(
    generations : Map.Map<Common.GenerationId, Types.Generation>,
    id : Common.GenerationId,
    userId : Common.UserId,
  ) : { #ok; #notFound; #unauthorized } {
    switch (generations.get(id)) {
      case null #notFound;
      case (?gen) {
        if (not Principal.equal(gen.userId, userId)) {
          #unauthorized
        } else {
          generations.remove(id);
          #ok
        };
      };
    };
  };
};
