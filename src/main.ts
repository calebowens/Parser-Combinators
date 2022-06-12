import { ParserHKT, ParserInput, ParserResult, StringParser } from './AbstractParser'
import { inspect } from 'util'

const parserA = new StringParser('foo')
const parserB = new StringParser('foo')

console.log(inspect(
  parserA.and<string, ParserHKT<string, unknown>>(parserB).parse(new ParserInput<string>('foofoo', 0))
  , false, 6))