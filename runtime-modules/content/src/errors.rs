use crate::*;
use frame_support::decl_error;

decl_error! {
    /// Content directory errors
    pub enum Error for Module<T: Trait> {

        // Curator Management Errors
        // -------------------------

        /// Curator group can`t be removed
        CuratorGroupRemovalForbidden,

        /// Curator under provided curator id is not a member of curaror group under given id
        CuratorIsNotAMemberOfGivenCuratorGroup,

        /// Curator under provided curator id is already a member of curaror group under given id
        CuratorIsAlreadyAMemberOfGivenCuratorGroup,

        /// Given curator group does not exist
        CuratorGroupDoesNotExist,

        /// Max number of curators per group limit reached
        CuratorsPerGroupLimitReached,

        /// Curator group is not active
        CuratorGroupIsNotActive,

        // Authentication Errors
        // ---------------------

        /// Lead authentication failed
        LeadAuthFailed,

        /// Member authentication failed
        MemberAuthFailed,

        /// Curator authentication failed
        CuratorAuthFailed,

        /// Expected root or signed origin
        BadOrigin,

        /// Operation Cannot be perfomed with this Actor
        ActorNotAuthorized,

        /// This content actor cannot own a channel
        ActorCannotOwnChannel,

        /// Channel Category Does not Exist.
        ChannelCategoryDoesNotExist,

        /// Channel Does Not Exist
        ChannelDoesNotExist,
    }
}
