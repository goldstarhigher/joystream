import { FlowProps } from '../../Flow'
import {
  ApplyOnOpeningsHappyCaseFixture,
  FillOpeningsFixture,
  ApplicantDetails,
  createDefaultOpeningParams,
} from '../../fixtures/workingGroups'
import { WorkingGroupModuleName } from '../../types'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { workingGroups } from '../../consts'
import { CreateLeadOpeningsFixture } from 'src/fixtures/workingGroups/CreateLeadOpeningFixture'

export default (skipIfAlreadySet = false, groups: WorkingGroupModuleName[] = workingGroups) =>
  async function leadOpening({ api, query }: FlowProps): Promise<void> {
    await Promise.all(
      groups.map(async (group) => {
        const debug = extendDebug(`flow:lead-opening:${group}`)
        debug('Started')
        api.enableDebugTxLogs()
        const leadId = await api.query[group].currentLead()
        if (leadId.isSome) {
          if (skipIfAlreadySet) {
            debug('Leader already set, skipping...')
            return
          }
          throw new Error('Cannot hire lead - lead already set!')
        }

        // replace this
        const openingParams = createDefaultOpeningParams(api)
        const createOpeningFixture = new CreateLeadOpeningsFixture(api, query, openingParams, group)
        const openingRunner = new FixtureRunner(createOpeningFixture)
        await openingRunner.run()
        const [openingId] = createOpeningFixture.getCreatedOpeningIds()

        const [roleAccount, stakingAccount, rewardAccount] = (await api.createKeyPairs(3)).map(({ key }) => key.address)
        const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [roleAccount])
        await new FixtureRunner(buyMembershipFixture).run()
        const [memberId] = buyMembershipFixture.getCreatedMembers()

        const addStakingAccFixture = new AddStakingAccountsHappyCaseFixture(api, query, [
          {
            asMember: memberId,
            account: stakingAccount,
          },
        ])
        await new FixtureRunner(addStakingAccFixture).run()
        await api.treasuryTransferBalance(stakingAccount, openingParams.stake)

        const applicantDetails: ApplicantDetails = {
          memberId,
          roleAccount,
          rewardAccount,
          stakingAccount,
        }

        const applyOnOpeningFixture = new ApplyOnOpeningsHappyCaseFixture(api, query, group, [
          {
            openingId,
            openingMetadata: openingParams.metadata,
            applicants: [applicantDetails],
          },
        ])
        const applicationRunner = new FixtureRunner(applyOnOpeningFixture)
        await applicationRunner.run()
        const [applicationId] = applyOnOpeningFixture.getCreatedApplicationsByOpeningId(openingId)

        // Run query node checks once this part of the flow is done
        await Promise.all([openingRunner.runQueryNodeChecks(), applicationRunner.runQueryNodeChecks()])

        // Fill opening
        const fillOpeningFixture = new FillOpeningsFixture(api, query, group, [openingId], [[applicationId]], true)
        await new FixtureRunner(fillOpeningFixture).runWithQueryNodeChecks()

        const workerIds = fillOpeningFixture.getCreatedWorkerIdsByOpeningId(openingId)
        await api.assignWorkerWellknownAccount(group, workerIds[0])

        debug('Done')
      })
    )
  }
