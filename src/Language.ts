import { TokenSet, isSingleVowel, tokenize } from './Token'

function nextInt (max: number = 1): number {
  return Math.floor(Math.random() * max)
}

function shuffle <A>(list: A[]): A[] {
  const copy = list.length ? list.slice() : []
  let curr = copy.length
  while (curr > 0) {
    const i = nextInt(curr)
    curr--
    ;
    const elem = copy[curr]
    copy[curr] = copy[i]
    copy[i] = elem
  }
  return copy
}

function pick <A>(list: A[]): A {
  return list[nextInt(list.length)]
}

function singleVowelMap (): { [char: string]: string } {
  const chars = 'aeiou'.split('')
  const reps = shuffle(chars)

  return chars.reduce((map, token, index) => {
    map[token] = reps[index]
    return map
  }, {})
}

function makeTokenMap (tokenSet: TokenSet, params: ChangerParams): { [ token: string ]: string } {
  const map = {}
  const keys = tokenSet.keys()
  const useFreq = params.useFreq || false
  const maxRetries = params.retry || 0

  let buffer = keys.slice()
  keys.forEach(tok => {
    if (isSingleVowel(tok)) {
      // Always preserve single vowel
      map[tok] = tok
    } else {

      let backward = false
      let links = tokenSet.followLinks(tok, true)
      if (!links.length) {
        backward = true
        links = tokenSet.followLinks(tok, false)
      }

      let hit: string
      let retry = 0
      let matchByFreq = false
      while (hit == null && retry < maxRetries) {
        let candidates: string[]
        if (!links.length || (useFreq && matchByFreq)) {
          // When chain is empty, use frequency as hints
          candidates = buffer.filter(thatTok => {
            return tokenSet.isUniq(tok) && tokenSet.isUniq(thatTok)
          })
        } else {
          // Normally, we may use chain
          const picked = pick(links)
          if (picked == null) {
            candidates = []
          } else {
            candidates = tokenSet.followLinks(picked.name, backward).map(val => val.name)
          }
        }

        hit = candidates.find(cand => {
          return tokenSet.test(tok, cand) && buffer.indexOf(cand) > -1
        })

        if (hit != null) {
          buffer = buffer.filter(val => val !== hit)
        } else {
          matchByFreq = true
        }

        retry++
      }

      map[tok] = (hit || tok)
    }
  })

  return map
}

function makeCuts (tokens: TokenSet, cutOccurs: number): string[] {
  return Object.keys(tokens.samples)
    .filter(val => {
      return (
        nextInt(100) <= cutOccurs &&
        !isSingleVowel(val) &&
        tokens.samples[val].freq.end > 0
      )
    })
}

export type ChangerParams = {
  cuts?: string[]
  cutOccurs?: number
  map?: StringMap
  mapOverrides?: StringMap
  minFreq?: number
  minLength?: number
  retry?: number
  useFreq?: boolean
  useSingleVowel?: boolean
  singleVowels?: StringMap
}

type StringMap = {
  [index: string]: string
}

class Changer {
  tokenSet: TokenSet
  options: ChangerParams
  map: StringMap
  mapOverrides: StringMap
  singleVowels: StringMap
  cuts: string[]

  constructor (
    tokenSet: TokenSet,
    params: ChangerParams = {}
  ) {
    this.tokenSet = tokenSet
    this.options = Object.assign(Changer.defaultParams(), params)
    this.singleVowels = this.options.singleVowels || singleVowelMap()
    this.cuts = this.options.cuts || makeCuts(this.tokenSet, this.options.cutOccurs)
    this.map = this.options.map || makeTokenMap(this.tokenSet, this.options)
    this.mapOverrides = this.options.mapOverrides || {}
  }

  private cut (tokens: string[]): string[] {
    if (tokens.length < Math.max(this.options.minLength, 2)) {
      return tokens
    } else {
      const last = tokens[tokens.length - 1]
      const penultimate = tokens[tokens.length - 2]

      if (this.cuts.indexOf(last) > -1 && this.tokenSet.isEnd(penultimate)) {
        return tokens.slice(1)
      } else {
        return tokens
      }
    }
  }

  replace (token: string): string {
    let newToken: string
    if (this.options.useSingleVowel && isSingleVowel(token)) {
      newToken = this.singleVowels[token]
    } else {
      newToken = this.mapOverrides[token] || this.map[token]
    }

    return newToken || token
  }

  changeTokens (word: string): string[] {
    return this.cut(tokenize(word)).map(val => this.replace(val))
  }

  translate (word: string): string {
    return this.changeTokens(word).join('')
  }

  sentence (text: string): string {
    return text.split(' ').map(word => this.translate(word)).join(' ')
  }

  toPlainObject (): any {
    return {
      tokenSet: this.tokenSet,
      options: Object.assign({}, this.options, {
        singleVowels: this.singleVowels,
        map: this.map,
        mapOverrides: this.mapOverrides,
        cuts: this.cuts
      })
    }
  }
}

namespace Changer {
  export const CUT_OCCURS = 15
  export const MIN_LENGTH = 4
  export const MIN_FREQ = 2
  export const MAX_RETRIES = 3

  export function defaultParams (): ChangerParams {
    return {
      cutOccurs: CUT_OCCURS,
      minFreq: MIN_FREQ,
      minLength: MIN_LENGTH,
      retry: MAX_RETRIES,
      useFreq: true,
      useSingleVowel: true
    }
  }
}

export { Changer }
