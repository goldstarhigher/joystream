import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { ValidatorCountProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import Debugger from 'debug'
import { Resource } from '../../Resources'

export default async function validatorCount({ api, lock }: FlowProps): Promise<void> {
  const debug = Debugger('integration-tests:flow:validatorCountProposal')
  debug('Started')
  await lock(Resource.Proposals)

  // Pre-conditions: members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()
  const proposedValidatorCount = new BN(300)

  const validatorCountProposalFixture: ValidatorCountProposalFixture = new ValidatorCountProposalFixture(
    api,
    proposer,
    proposedValidatorCount
  )
  await new FixtureRunner(validatorCountProposalFixture).run()

  debug('Done')
}
