import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import { createParamOptions } from '../../helpers/promptOptions'
import { Bytes } from '@polkadot/types'

export default class WorkingGroupsEvictWorker extends WorkingGroupsCommandBase {
  static description = 'Evicts given worker. Requires lead access.'
  static args = [
    {
      name: 'workerId',
      required: true,
      description: 'Worker ID',
    },
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { args } = this.parse(WorkingGroupsEvictWorker)

    const lead = await this.getRequiredLeadContext()

    const workerId = parseInt(args.workerId)
    // This will also make sure the worker is valid
    const groupMember = await this.getWorkerForLeadAction(workerId)

    // TODO: Terminate worker text limits? (minMaxStr)
    const rationale = (await this.promptForParam('Bytes', createParamOptions('rationale'))) as Bytes
    const shouldSlash = groupMember.stake
      ? await this.simplePrompt({
          message: `Should the worker stake (${formatBalance(groupMember.stake)}) be slashed?`,
          type: 'confirm',
          default: false,
        })
      : false

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(lead.roleAccount),
      apiModuleByGroup[this.group],
      'terminateRole',
      [workerId, rationale, shouldSlash]
    )

    this.log(chalk.green(`Worker ${chalk.magentaBright(workerId)} has been evicted!`))
    if (shouldSlash) {
      this.log(
        chalk.green(`Worker stake totalling ${chalk.magentaBright(formatBalance(groupMember.stake))} has been slashed!`)
      )
    }
  }
}
