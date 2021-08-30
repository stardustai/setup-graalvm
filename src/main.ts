import {getInput, setFailed} from '@actions/core'
import {getGraalVM, getNativeImage} from './graalvm'

async function run(): Promise<void> {
  try {
    await getGraalVM(
      getInput('java-version', {
        required: true
      }),
      getInput('graalvm-version', {
        required: true
      })
    )

    if (getInput('native-image')) {
      await getNativeImage()
    }
  } catch (error) {
    setFailed(error.message)
  }
}

run()
