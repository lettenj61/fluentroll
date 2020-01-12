export type Frequency = {
  start: number
  middle: number
  end: number
}

export type Link = {
  name: string
  count: number
}

export type Chain = {
  prev: Link[]
  next: Link[]
}

function newFreq (): Frequency {
  return {
    start: 0,
    middle: 0,
    end: 0,
  }
}

/**
 * 
 * @param {string}  name 
 * @param {number}  count 
 */
function newLink (name, count): Link {
  return {
    name,
    count
  }
}

function emptyChain (): Chain {
  return {
    prev: [],
    next: []
  }
}

/**
 * 
 * @param {string}  token 
 * @param {Link[]}  links 
 */
function appendChain (token: string, links: Link[]): void {
  const link = links.find(val => val.name === token)
  if (link) {
    link.count++
  } else {
    links.push(newLink(token, 1))
  }
}

const splitterRE = /[aeiouy]+|[^aeiouy]+/g

/**
 * 
 * @param {string}  word 
 */
export function tokenize (word: string): string[] {
  const matches = String(word).toLowerCase().trim().match(splitterRE)
  return matches == null ? [] : matches
}

/**
 * 
 * @param {TokenSet}  tokenSet 
 * @param {string[]}  tokens 
 */
function feed (tokenSet: TokenSet, tokens: string[]): void {
  let prev: string
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (tokenSet.samples[token] == null) {
      tokenSet.samples[token] = {
        freq: newFreq(),
        chain: emptyChain()
      }
    }
    const { freq, chain } = tokenSet.samples[token]
    const isLastElement = (i === tokens.length - 1)
    const next = isLastElement ? null : tokens[i + 1]
    ;

    if (i === 0) {
      freq.start++
    } else if (isLastElement) {
      freq.end++
    } else {
      freq.middle++
    }

    if (prev != null) {
      appendChain(prev, chain.prev)
    }
    if (next != null) {
      appendChain(next, chain.next)
    }

    prev = token
  }
}

export const vowels: ReadonlyArray<string> = ['a', 'e', 'i', 'o', 'u', 'y']

export function isVowel (token: string): boolean {
  return token.split('').reduce((res, char) => {
    return res && vowels.indexOf(char) > -1
  }, true)
}

export function isSingleVowel (token: string) {
  return token !== 'y' && vowels.indexOf(token) > -1
}

type TokenItem = {
  freq: Frequency
  chain: Chain
}

export class TokenSet {

  samples: { [index: string]: TokenItem }

  /**
   * 
   * @param {string[]}  words 
   */
  constructor (words: string[] = []) {
    this.samples = {}
    words.forEach(word => {
      const tokens = tokenize((word || ''))
      feed(this, tokens)
    })
  }

  keys (): string[] {
    return Object.keys(this.samples)
  }

  get (key: string): TokenItem {
    return this.samples[key]
  }

  followLinks (token: string, reverse: boolean = false): Link[] {
    const entry = this.get(token)
    if (entry == null) {
      return []
    } else {
      const toFollow = reverse ? entry.chain.prev : entry.chain.next
      return toFollow.slice().sort((a, b) => b.count - a.count)
    }
  }

  isEnd (token: string): boolean {
    const { freq } = this.get(token)
    return freq && freq.end > 0
  }

  isUniq (token: string): boolean {
    const item = this.samples[token]
    if (item == null) {
      return false
    } else {
      const { start, middle, end } = item.freq
      return start + middle + end === 1
    }
  }

  checkPosition (tok1: string, tok2: string): boolean {
    const item1 = this.samples[tok1]
    const item2 = this.samples[tok2]

    if (item1 == null || item2 == null) {
      return false
    } else {
      const freq1 = item1.freq
      const freq2 = item2.freq

      return (
        freq1.start > 0 === freq2.start > 0 &&
        freq1.end > 0 === freq2.end > 0
      )
    }
  }

  test (tok1: string, tok2: string): boolean {
    return (
      tok1 !== tok2 &&
      isVowel(tok1) === isVowel(tok2) &&
      this.checkPosition(tok1, tok2)
    )
  }
}
