import * as core from '@actions/core'
import * as parser from '../src/changelogparser'
import * as main from '../src/main'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

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

    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    parseChangelogMock = jest
      .spyOn(parser, 'ParseChangelog')
      .mockReturnValue('parsed changelog')
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
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
    expect(runMock).toHaveReturned()

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

  it('sets a failed status', async () => {
    const failure = new Error('parse failed')
    getInputMock.mockImplementation(name =>
      name === 'changelogfile' ? 'CHANGELOG.md' : 'v1.2.3'
    )
    parseChangelogMock.mockImplementation(() => {
      throw failure
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(setFailedMock).toHaveBeenNthCalledWith(1, 'parse failed')
    expect(errorMock).not.toHaveBeenCalled()
  })
})
