import {addPath, debug, exportVariable, info} from '@actions/core'
import {exec} from '@actions/exec'
import {mkdirP, rmRF} from '@actions/io'
import {
  cacheDir,
  downloadTool,
  extractTar,
  extractZip,
  find
} from '@actions/tool-cache'
import {readdirSync, statSync} from 'fs'
import {join, normalize} from 'path'

const IS_WINDOWS = process.platform === 'win32'
const PLATFORM = IS_WINDOWS
  ? 'windows'
  : process.platform === 'darwin'
  ? 'darwin'
  : 'linux'
const ARCH = process.arch === 'arm64' ? 'aarch64' : 'amd64'
const TOOL_NAME = 'GraalVM'

interface OptionType {
  tempDir: string
  jvmDir: string
  binDir: string
  appDir: string
  javaHome: string
  graalHome: string
}

const OPTIONS = {
  tempDir:
    process.env['RUNNER_TEMP'] ||
    join(
      IS_WINDOWS
        ? process.env['USERPROFILE'] || 'C:\\'
        : PLATFORM === 'darwin'
        ? '/Users'
        : '/home',
      'actions',
      'temp'
    ),
  jvmDir: '/Library/Java/JavaVirtualMachines',
  binDir: 'bin',
  appDir: '/Contents/Home',
  javaHome: 'JAVA_HOME',
  graalHome: 'GRAALVM_HOME'
}

export async function getGraalVM(
  javaVersion: string,
  graalvmVersion: string,
  options?: OptionType
): Promise<string> {
  options = {
    ...OPTIONS,
    ...options
  }

  const version = getVersion(javaVersion, graalvmVersion)
  const tempDir = join(
    options.tempDir,
    `temp_${Math.floor(Math.random() * 2000000000)}`
  )

  let toolPath = find(TOOL_NAME, version)
  if (toolPath) {
    debug(`${TOOL_NAME} found in cache ${toolPath}`)
  } else {
    const compressedFileExtension = IS_WINDOWS ? '.zip' : '.tar.gz'
    const downloadUrl = `https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-${graalvmVersion}/graalvm-ce-${version}${compressedFileExtension}`

    info(`Downloading ${TOOL_NAME} from ${downloadUrl}`)

    const graalvmFile = await downloadTool(downloadUrl)
    const graalvmDir = await decompressDownload(
      graalvmFile,
      compressedFileExtension,
      tempDir
    )

    debug(`${TOOL_NAME} extracted to ${graalvmDir}`)

    toolPath = await cacheDir(graalvmDir, TOOL_NAME, version)
  }

  if (PLATFORM === 'darwin') {
    await rmRF(tempDir)

    exportVariable(options.javaHome, join(toolPath, options.appDir))
    exportVariable(options.graalHome, join(toolPath, options.appDir))
    addPath(join(toolPath, options.appDir, options.binDir))
  } else {
    exportVariable(options.javaHome, toolPath)
    exportVariable(options.graalHome, toolPath)
    addPath(join(toolPath, options.binDir))
  }

  return toolPath
}

export async function getNativeImage(): Promise<void> {
  await exec('gu install native-image')
}

function getVersion(javaVersion: string, graalvmVersion: string): string {
  return `java${javaVersion}-${PLATFORM}-${ARCH}-${graalvmVersion}`
}

async function decompressDownload(
  compressedFile: string,
  compressedFileExtension: string,
  destinationDir: string
): Promise<string> {
  await mkdirP(destinationDir)

  const graalvmFile = normalize(compressedFile)
  const stats = statSync(graalvmFile)

  if (stats) {
    if (stats.isFile()) {
      await extractFiles(graalvmFile, compressedFileExtension, destinationDir)

      return join(destinationDir, readdirSync(destinationDir)[0])
    } else {
      throw new Error(`Failed to extract ${graalvmFile} which is not a file`)
    }
  } else {
    throw new Error(`${graalvmFile} does not exist`)
  }
}

async function extractFiles(
  compressedFile: string,
  compressedFileExtension: string,
  destinationDir: string
): Promise<void> {
  const stats = statSync(compressedFile)
  if (stats) {
    if (stats.isFile()) {
      if (
        '.tar' === compressedFileExtension ||
        '.tar.gz' === compressedFileExtension
      ) {
        await extractTar(compressedFile, destinationDir)
      } else if ('.zip' === compressedFileExtension) {
        await extractZip(compressedFile, destinationDir)
      } else {
        throw new Error(
          `Failed to extract ${compressedFile} which is in an unrecognized compression format`
        )
      }
    } else {
      throw new Error(`Failed to extract ${compressedFile} which is not a file`)
    }
  } else {
    throw new Error(`${compressedFile} does not exist`)
  }
}
