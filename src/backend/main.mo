import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Common "types/common";
import Types "types/generation";
import GenerationMixin "mixins/generation-api";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let generations = Map.empty<Common.GenerationId, Types.Generation>();
  let userProfiles = Map.empty<Common.UserId, Types.UserProfile>();
  let nextId = { var value : Common.GenerationId = 0 };

  include GenerationMixin(accessControlState, generations, userProfiles, nextId);
};
