import {createAuthClient} from "better-auth/react";
import {
    adminClient,
    genericOAuthClient,
    multiSessionClient,
    oidcClient,
    organizationClient,
    passkeyClient,
    twoFactorClient,
} from "better-auth/client/plugins";
import {toast} from "sonner";

export const authClient = createAuthClient({
    plugins: [
        organizationClient(),
        twoFactorClient({
            onTwoFactorRedirect() {
                window.location.href = "/two-factor";
            },
        }),
        passkeyClient(),
        adminClient(),
        multiSessionClient(),
        oidcClient(),
        genericOAuthClient(),
    ],
    fetchOptions: {
        onError(e) {
            if (e.error.status === 429) {
                toast.error("Too many requests. Please try again later.");
            }
        },
    },
});

export const {
    signUp,
    signIn,
    signOut,
    useSession,
    organization,
    useListOrganizations,
    useActiveOrganization,
} = authClient;
