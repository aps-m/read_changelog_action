import * as core from '@actions/core'
import * as parser from '../src/changelogparser'
import * as main from '../src/main'

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let parseChangelogMock: jest.SpiedFunction<typeof parser.ParseChangelog>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.replaceProperty(process, 'env', {
      ...process.env,
      GITHUB_REPOSITORY: 'APS_Soft/mir'
    })

    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    parseChangelogMock = jest
      .spyOn(parser, 'ParseChangelog')
      .mockReturnValue('parsed changelog')
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sets the changelog content output', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'changelogfile':
          return 'CHANGELOG.md'
        case 'tag':
          return 'v1.2.3'
        default:
          return ''
      }
    })

    await main.run()

    // Verify that all of the core library functions were called correctly
    expect(parseChangelogMock).toHaveBeenCalledWith('CHANGELOG.md', 'v1.2.3')
    expect(debugMock).toHaveBeenNthCalledWith(
      1,
      'Input filename: CHANGELOG.md Tag: v1.2.3'
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'content',
      'parsed changelog'
    )
    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('links every issue reference using the workflow repository name', async () => {
    parseChangelogMock.mockReturnValue(
      'Тест (#35). Ещё (#7) и (#35).\r\nБез ссылки: #8, (#abc), (# 9).'
    )

    await main.run()

    expect(setOutputMock).toHaveBeenCalledWith(
      'content',
      'Тест ([#35](https://git.aps-m.com/APS_Soft/mir/issues/35)). ' +
        'Ещё ([#7](https://git.aps-m.com/APS_Soft/mir/issues/7)) и ' +
        '([#35](https://git.aps-m.com/APS_Soft/mir/issues/35)).\r\n' +
        'Без ссылки: #8, (#abc), (# 9).'
    )
  })

  it('uses the current repository name with the fixed APS_Soft owner', async () => {
    process.env.GITHUB_REPOSITORY = 'another-owner/test_notification'
    parseChangelogMock.mockReturnValue('- Тест 2 (#123).')

    await main.run()

    expect(setOutputMock).toHaveBeenCalledWith(
      'content',
      '- Тест 2 ([#123](https://git.aps-m.com/APS_Soft/test_notification/issues/123)).'
    )
  })

  it('preserves the content when the repository is unavailable', async () => {
    delete process.env.GITHUB_REPOSITORY
    parseChangelogMock.mockReturnValue('Тест (#35).')

    await main.run()

    expect(setOutputMock).toHaveBeenCalledWith('content', 'Тест (#35).')
  })

  it('links mixed local, repository and organization issue references', async () => {
    parseChangelogMock.mockReturnValue(
      '(#1), (other_repo-2.js#35), (Other-Org/another_repo#7), (other_repo-2.js#35).'
    )

    await main.run()

    expect(setOutputMock).toHaveBeenCalledWith(
      'content',
      '([#1](https://git.aps-m.com/APS_Soft/mir/issues/1)), ' +
        '([#35](https://git.aps-m.com/APS_Soft/other_repo-2.js/issues/35)), ' +
        '([#7](https://git.aps-m.com/Other-Org/another_repo/issues/7)), ' +
        '([#35](https://git.aps-m.com/APS_Soft/other_repo-2.js/issues/35)).'
    )
  })

  it.each([undefined, '', 'APS_Soft/'])(
    'links explicit repositories when GITHUB_REPOSITORY is %p',
    async repository => {
      if (repository === undefined) {
        delete process.env.GITHUB_REPOSITORY
      } else {
        process.env.GITHUB_REPOSITORY = repository
      }
      parseChangelogMock.mockReturnValue('(#1), (repo#2), (org/repo#3).')

      await main.run()

      expect(setOutputMock).toHaveBeenCalledWith(
        'content',
        '(#1), ([#2](https://git.aps-m.com/APS_Soft/repo/issues/2)), ' +
          '([#3](https://git.aps-m.com/org/repo/issues/3)).'
      )
    }
  )

  it('preserves malformed and unparenthesized qualified references', async () => {
    const content =
      '(repo#abc), (repo#), (repo# 1), (org/#1), (/repo#1), ' +
      '(org/repo/extra#1), (org/re po#1), repo#1, org/repo#1.'
    parseChangelogMock.mockReturnValue(content)

    await main.run()

    expect(setOutputMock).toHaveBeenCalledWith('content', content)
  })

  it('sets a failed status', async () => {
    const failure = new Error('parse failed')
    getInputMock.mockImplementation(name =>
      name === 'changelogfile' ? 'CHANGELOG.md' : 'v1.2.3'
    )
    parseChangelogMock.mockImplementation(() => {
      throw failure
    })

    await main.run()

    // Verify that all of the core library functions were called correctly
    expect(setFailedMock).toHaveBeenNthCalledWith(1, 'parse failed')
    expect(errorMock).not.toHaveBeenCalled()
  })
})
