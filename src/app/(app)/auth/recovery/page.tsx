import {oryConfig} from "@/lib/ory/ory.config";
import { Recovery } from "@ory/elements-react/theme"
import { getRecoveryFlow, OryPageParams } from "@ory/nextjs/app"


export default async function RecoveryPage(props: OryPageParams) {
  const flow = await getRecoveryFlow(oryConfig, props.searchParams)

  if (!flow) {
    return null
  }

  return (
    <Recovery
      flow={flow}
      config={oryConfig}
      components={{}}
    />
  )
}
