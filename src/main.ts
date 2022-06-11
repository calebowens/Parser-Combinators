import { ParserHKT, ResultParserHKT, StringParser } from './AbstractParser'
import { inspect } from 'util'

const parserA = new StringParser('foo')
const parserB = new StringParser('foo')

console.log(inspect(
  parserA.and<[string, string], ParserHKT<[string, string]>>(parserB).parse<ResultParserHKT<[string, string], undefined>>(['foofoo', ''])
  , false, 6))