import type { OryClientConfiguration } from "@ory/elements-react"

export const oryConfig: OryClientConfiguration = {
    project: {
        default_locale: "en",
        default_redirect_url: "/",
        error_ui_url: "/error",
        locale_behavior: "force_default",
        login_ui_url: "/auth/login",
        name: "Ory Next.js App Router Example",
        recovery_enabled: true,
        recovery_ui_url: "/auth/recovery",
        registration_enabled: true,
        registration_ui_url: "/auth/registration",
        settings_ui_url: "/settings",
        verification_enabled: true,
        verification_ui_url: "/auth/verification",
    },
    sdk: {
        url: process.env.NEXT_PUBLIC_ORY_SDK_URL,
    }
}
