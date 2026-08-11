declare module "psl" {
  export const errorCodes: {
    readonly DOMAIN_TOO_SHORT: "DOMAIN_TOO_SHORT"
    readonly DOMAIN_TOO_LONG: "DOMAIN_TOO_LONG"
    readonly LABEL_STARTS_WITH_DASH: "LABEL_STARTS_WITH_DASH"
    readonly LABEL_ENDS_WITH_DASH: "LABEL_ENDS_WITH_DASH"
    readonly LABEL_TOO_LONG: "LABEL_TOO_LONG"
    readonly LABEL_TOO_SHORT: "LABEL_TOO_SHORT"
  }

  export type ErrorResult<TCode extends keyof typeof errorCodes> = {
    error: {
      code: TCode
      message: string
    }
    input: string
  }

  export type ParsedDomain = {
    domain: string | null
    input: string
    listed: boolean
    sld: string | null
    subdomain: string | null
    tld: string | null
  }

  export function get(domain: string): string | null

  export function parse(
    domain: string,
  ): ParsedDomain | ErrorResult<keyof typeof errorCodes>
}
