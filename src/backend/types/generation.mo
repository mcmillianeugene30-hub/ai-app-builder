import Common "common";

module {
  public type CodeSnippet = {
    filename : Text;
    code : Text;
  };

  public type Overview = {
    concept : Text;
    targetUsers : Text;
    keyFeatures : [Text];
  };

  public type Architecture = {
    systemDesign : Text;
    techStack : [Text];
    dataFlow : Text;
  };

  public type GenerationResult = {
    overview : Overview;
    architecture : Architecture;
    codeSnippets : [CodeSnippet];
  };

  public type Generation = {
    id : Common.GenerationId;
    userId : Common.UserId;
    prompt : Text;
    overview : Overview;
    architecture : Architecture;
    codeSnippets : [CodeSnippet];
    createdAt : Common.Timestamp;
  };

  public type GenerationSummary = {
    id : Common.GenerationId;
    promptPreview : Text;
    createdAt : Common.Timestamp;
  };

  public type UserProfile = {
    name : Text;
  };
};
