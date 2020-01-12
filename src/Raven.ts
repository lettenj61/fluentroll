import { TokenSet, tokenize } from './Token'
import { Changer, ChangerParams } from './Language'

export default {
  text: {
    tokenize,

    tokenSet (words: string[]): TokenSet {
      return new TokenSet(words)
    },

    changer (tokenSet: TokenSet, params: ChangerParams) {
      return new Changer(tokenSet, params)
    }
  }
}