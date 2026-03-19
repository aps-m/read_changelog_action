import * as fs from 'fs'

export function ParseChangelog(filename: string, tag: string): string {
  let result = ''
  const words = fs.readFileSync(filename, 'utf-8')

  const normalizedTag = tag.replace('v', '')

  let LastFoundTag = ''

  const arr = words.split(/\r?\n/)

  // Read file line by line
  for (const line of arr) {
    const regex = /[0-9]+.[0-9]+.[0-9]+[-]?[bB]?[0-9]?[0-9]?[0-9]?[0-9]?[0-9]?/g
    const regex_tag_header = /[A-Za-zА-Яа-я]{2}/g
    const probe = regex.exec(line)
    const is_not_header = regex_tag_header.exec(line)

    if (probe && !is_not_header) {
      LastFoundTag = probe[0]
    } else {
      if (LastFoundTag.search(normalizedTag) !== -1) {
        result += `${line}\r\n`
      }
    }
  }

  result = result.trim()

  return result
}
