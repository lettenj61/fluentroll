import { Elm } from './Fluentroll.elm'
import Raven from './Raven'
import words from './resources/words.json'
import { tokenize } from './Token'

window.addEventListener('DOMContentLoaded', () => {
  const tokenSet = Raven.text.tokenSet(words)
  const language = Raven.text.changer(tokenSet)

  const app = Elm.Fluentroll.init({
    node: document.getElementById('elm')
  })

  app.ports.requestTranslate.subscribe(text => {
    const words = text.split(' ').filter(val => val.trim() !== '')
    const result = words.reduce((bag, word) => {
      bag.push({
        source: tokenize(word),
        result: language.changeTokens(word)
      })

      return bag
    }, [])

    app.ports.gotTranslation.send(result)
  })
})
