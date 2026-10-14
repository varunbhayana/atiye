/**
 * Hinglish (Roman-script Hindi + English) wording for every Maths question and hint.
 * Built from the question's structured data, so the maths is identical in both languages.
 */
import type { Language } from '../../core/state';
import { POSITION_ANCHORS, ROUTINES, TOPPING_INFO, creature, food, shopItem, tokenInfo } from './catalog';
import { hintFor } from './hints';
import type { ChooseQuestion, MathsQuestion, NumberTask } from './types';

const PLACE: Record<string, string> = {
  'in the garden': 'garden mein',
  'on the pond': 'talaab pe',
  'in the pond': 'talaab mein',
  'by the pond': 'talaab ke paas',
  'in the meadow': 'maidan mein',
  'in the sky': 'aasmaan mein',
  'on the ice': 'barf pe',
};

function taskHi(t: NumberTask, verb: string): { prompt: string; speech: string } {
  switch (t.type) {
    case 'identify':
      return { prompt: `Number ${t.n} ${verb}!`, speech: `Number ${t.n} ${verb}!` };
    case 'after':
      return { prompt: `${t.n} ke just baad kya aata hai?`, speech: `${t.n} ke just baad kaunsa number aata hai?` };
    case 'before':
      return { prompt: `${t.n} se just pehle kya aata hai?`, speech: `${t.n} se just pehle kaunsa number aata hai?` };
    case 'between':
      return { prompt: `${t.low} aur ${t.high} ke beech mein kaunsa number hai?`, speech: `${t.low} aur ${t.high} ke beech mein kaunsa number hai?` };
    case 'add':
      return { prompt: `${t.a} + ${t.b} = ?`, speech: `${t.a} plus ${t.b} kitna hota hai?` };
    case 'sub':
      return { prompt: `${t.a} − ${t.b} = ?`, speech: `${t.a} mein se ${t.b} gaye, toh kitne bache?` };
  }
}

function chooseHi(q: ChooseQuestion): { prompt: string; speech: string } {
  const r = q.rule;
  const max = r.type === 'max';
  const three = q.options.length >= 3;
  const same = (p: string) => ({ prompt: p, speech: p });
  switch (q.variant) {
    case 'more-group':
      return same(max ? 'Kis group mein ZYADA hain?' : 'Kis group mein KAM hain?');
    case 'compare-numbers':
      return same(max ? 'Kaunsa number BADA hai?' : 'Kaunsa number CHHOTA hai?');
    case 'symbol':
      return { prompt: q.prompt, speech: `${q.scene?.left} bada hai, chhota hai, ya ${q.scene?.right} ke barabar? Magarmach hamesha bade number ko khaata hai!` };
    case 'size':
      return same(max ? (three ? 'Sabse BADA kaunsa hai?' : 'Kaunsa BADA hai?') : three ? 'Sabse CHHOTA kaunsa hai?' : 'Kaunsa CHHOTA hai?');
    case 'height':
      return same(max ? (three ? 'Sabse LAMBA kaunsa hai?' : 'Kaunsa LAMBA hai?') : three ? 'Sabse CHHOTA kaunsa hai?' : 'Kaunsa CHHOTA hai?');
    case 'length':
      return same(max ? (three ? 'Sabse LAMBA kaunsa hai?' : 'Kaunsa LAMBA hai?') : three ? 'Sabse CHHOTA kaunsa hai?' : 'Kaunsa CHHOTA hai?');
    case 'weight':
      return same(max ? 'Kaunsa BHAARI hai?' : 'Kaunsa HALKA hai?');
    case 'measure':
      return { prompt: 'Ye kitne blocks lamba hai?', speech: 'Blocks gino. Ye kitne blocks lamba hai?' };
    case 'day-night':
      return r.type === 'match' && r.value === 'night' ? same('RAAT mein kya dikhta hai?') : same('DIN mein kya dikhta hai?');
    case 'routine': {
      const name = ROUTINES.find((x) => q.options.every((o) => x.steps.some((s) => s.emoji === (o.visual.type === 'emoji' ? o.visual.emoji : ''))))?.name;
      const lead = name === 'plant' ? 'Paudha ugta hai.' : name === 'morning' ? 'Subah…' : 'Sone se pehle…';
      return same(`${lead} Sabse ${r.type === 'min' ? 'PEHLE' : 'BAAD mein'} kya aata hai?`);
    }
    case 'odd-one-out':
      return { prompt: 'Inmein se kaun ALAG hai?', speech: 'Teen cheezein ek jaisi hain. Kaun alag hai?' };
    case 'position': {
      const anchor = POSITION_ANCHORS.find((a) => a.emoji === q.scene?.anchor);
      const name = anchor?.name === 'chair' ? 'kursi' : 'box';
      const pos = r.type === 'match' ? r.value : 'on';
      const word = pos === 'on' ? 'UPAR' : pos === 'under' ? 'NEECHE' : 'BAGAL mein';
      return { prompt: `${name.charAt(0).toUpperCase() + name.slice(1)} ke ${word} kya hai?`, speech: `${name} ko dekho. ${name} ke ${word.toLowerCase()} kya hai?` };
    }
  }
}

function hinglishText(q: MathsQuestion): { prompt: string; speech: string } {
  switch (q.kind) {
    case 'count': {
      const c = creature(q.creature);
      const place = PLACE[c.place] ?? c.place;
      const total = q.groups.reduce((a, b) => a + b, 0);
      const nm = (n: number) => (n === 1 ? c.one : c.many);
      if (q.variant === 'together')
        return { prompt: `${q.groups[0]} ${nm(q.groups[0]!)} aur ${q.groups[1]} aur aa gaye. Total kitne?`, speech: `${q.groups[0]} ${nm(q.groups[0]!)} ${place} ${q.groups[0] === 1 ? 'hai' : 'hain'}. ${q.groups[1]} aur aa gaye. Ab total kitne ${c.many} hain?` };
      if (q.variant === 'takeaway')
        return { prompt: `${total} ${c.many} the. ${q.leaving} chale gaye. Kitne bache?`, speech: `${total} ${c.many} ${place} the. ${q.leaving} chale gaye. Ab kitne ${c.many} bache?` };
      return { prompt: `${place.charAt(0).toUpperCase() + place.slice(1)} kitne ${c.many} hain?`, speech: `${place} kitne ${c.many} hain? Har ek pe tap karke gino!` };
    }
    case 'feed': {
      const f = food(q.food);
      if (q.variant === 'parts')
        return { prompt: `Monster ko pehle ${q.parts[0]} ${q.parts[0] === 1 ? f.one : f.many}, phir ${q.parts[1]} aur do!`, speech: `Monster ko bhookh lagi hai! Pehle ${q.parts[0]} ${q.parts[0] === 1 ? f.one : f.many} do, phir ${q.parts[1]} aur. Ho jaaye toh Done dabao.` };
      const n = q.parts[0]!;
      return { prompt: `Monster ko ${n} ${n === 1 ? f.one : f.many} chahiye!`, speech: `Bhookhe monster ko ${n} ${n === 1 ? f.one : f.many} chahiye! ${n === 1 ? 'Use' : 'Unhe'} uske muh mein daalo, phir Done dabao.` };
    }
    case 'balloon': {
      const t = taskHi(q.task, 'wala balloon phodo');
      const sum = q.task.type === 'add' || q.task.type === 'sub';
      return sum ? { prompt: 'Sahi answer wala balloon phodo!', speech: `${t.speech} Sahi answer wala balloon phodo.` } : t;
    }
    case 'catch': {
      const t = taskHi(q.task, 'wala star pakdo');
      const sum = q.task.type === 'add' || q.task.type === 'sub';
      if (sum) return { prompt: 'Sahi answer wala star pakdo!', speech: `${t.speech} Sahi answer wala star pakdo.` };
      return q.task.type === 'identify' ? t : { prompt: `Answer pakdo! ${t.prompt}`, speech: t.speech };
    }
    case 'treasure': {
      const t = taskHi(q.task, 'dhoondho');
      return { prompt: `Kaunsi chaabi chest kholegi? ${t.prompt}`, speech: `Khazane ke chest pe number lock hai. ${t.speech} Sahi chaabi lock pe le jao.` };
    }
    case 'train': {
      if (q.variant === 'order') {
        const p = q.direction === 'asc' ? 'Numbers ko order mein lagao — sabse chhota pehle!' : 'Numbers ko order mein lagao — sabse bada pehle!';
        return { prompt: p, speech: p };
      }
      if (Math.abs(q.step) > 1) return { prompt: `${Math.abs(q.step)}-${Math.abs(q.step)} karke gino${q.step < 0 ? ' (ulta)' : ''}! Khaali jagah bharo.`, speech: `Ye train ${Math.abs(q.step)}-${Math.abs(q.step)} karke ${q.step < 0 ? 'ulta ' : ''}ginti hai. Kaunse numbers missing hain?` };
      if (q.step < 0) return { prompt: 'Ulta gino! Khaali dabba bharo.', speech: 'Ye train ulti ginti karti hai. Kaunsa number missing hai?' };
      return q.missing.length === 1
        ? { prompt: 'Train mein kaunsa number missing hai?', speech: 'Ek dabba khaali hai! Sahi number train pe le jao.' }
        : { prompt: 'Train mein kaunse numbers missing hain?', speech: 'Kuch dabbe khaali hain! Sahi numbers train pe le jao.' };
    }
    case 'pizza': {
      const list = q.toppings.map((t) => `${t.count} ${t.count === 1 ? TOPPING_INFO[t.type]!.one : TOPPING_INFO[t.type]!.many}`);
      const joined = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} aur ${list[list.length - 1]}`;
      return { prompt: `Pizza pe ${joined} lagao!`, speech: `Chalo pizza banate hain! Pizza pe ${joined} lagao. Phir Done dabao.` };
    }
    case 'shapes':
      return q.variant === 'pick-one'
        ? { prompt: `Inmein se ${q.target} kaunsa hai?`, speech: `${q.target} dhoondho aur us pe tap karo!` }
        : { prompt: `Saare ${q.target}s dhoondho!`, speech: `Shape detective bano! Picture mein saare ${q.target}s dhoondho. Phir Done dabao.` };
    case 'pattern': {
      const atEnd = q.blankIndex === q.sequence.length - 1;
      const ask = atEnd ? 'Aage kya aayega?' : 'Kya missing hai?';
      if (q.tokenSet === 'numbers') return { prompt: atEnd ? 'Aage kaunsa number aayega?' : 'Kaunsa number missing hai?', speech: `Number pattern dekho. ${atEnd ? 'Aage kaunsa number aayega?' : 'Kaunsa number missing hai?'}` };
      const u = q.unit.length;
      const said = q.sequence.slice(0, Math.min(q.blankIndex, 2 * u)).map((t) => tokenInfo(q.tokenSet, t).label);
      return { prompt: ask, speech: `${said.join(', ')}… ${ask}` };
    }
    case 'shop': {
      const item = shopItem(q.item);
      return q.variant === 'spend'
        ? { prompt: `Tumhare paas ${q.have} coins hain. ${item.name} ${q.amount} coins ka hai. Pay karo!`, speech: `Tumhare paas ${q.have} coins hain. ${item.name} ${q.amount} coins ka hai. Counter pe ${q.amount} coins rakho.` }
        : { prompt: `Tumhare paas ${q.have} coins hain. Dadi ne ${q.amount} aur diye!`, speech: `Tumhare paas ${q.have} coins hain. Dadi ne ${q.amount} aur coins diye. Unhe apne purse mein daalo.` };
    }
    case 'numberline': {
      const dir = q.direction === 'forward' ? 'aage' : 'peeche';
      return { prompt: `${q.start} se shuru karo. ${q.jumps} jump ${dir}. Kahan pahunche?`, speech: `Frog ${q.start} pe hai. Use ${q.jumps} jump ${dir} karwao. Phir us number pe tap karo jahan wo pahuncha.` };
    }
    case 'tower': {
      if (q.variant === 'build') return { prompt: `${q.target} blocks ka tower banao!`, speech: `${q.target} blocks ka tower banao. Blocks pe tap karke jodo. Ho jaaye toh Done dabao.` };
      const p = { taller: 'Kaunsa tower zyada LAMBA hai?', shorter: 'Kaunsa tower CHHOTA hai?', more: 'Kis tower mein ZYADA blocks hain?', fewer: 'Kis tower mein KAM blocks hain?' }[q.ask];
      return { prompt: p, speech: p };
    }
    case 'choose':
      return chooseHi(q);
  }
}

export function questionText(q: MathsQuestion, lang: Language): { prompt: string; speech: string } {
  if (lang === 'en') return { prompt: q.prompt, speech: q.speech ?? q.prompt };
  return hinglishText(q);
}

export function hintText(q: MathsQuestion, lang: Language): string {
  if (lang === 'en') return hintFor(q);
  switch (q.kind) {
    case 'count':
      if (q.variant === 'together') return `Pehle group gino, phir naye ${creature(q.creature).many} ko ginte raho.`;
      if (q.variant === 'takeaway') return `Sirf unko gino jo ruke hue hain.`;
      return `Har ${creature(q.creature).one} pe ek baar tap karo. Gin-gin ke bolo!`;
    case 'feed':
      return `Har ${food(q.food).one} dete waqt gino. Wapas lena ho toh tummy wale pe tap karo.`;
    case 'balloon':
    case 'treasure':
    case 'catch': {
      const t = q.task;
      if (t.type === 'add') return `${Math.max(t.a, t.b)} se shuru karo aur ungliyon pe ${Math.min(t.a, t.b)} aur gino.`;
      if (t.type === 'sub') return `${t.a} ungliyan khadi karo. ${t.b} neeche karo. Kitni khadi hain?`;
      if (t.type === 'after') return `Gino: …${t.n}, aur phir?`;
      if (t.type === 'before') return `${t.n} tak gino. Uske just pehle kya bola?`;
      if (t.type === 'between') return `${t.low} se ${t.high} tak gino. Beech mein kaunsa aaya?`;
      return `Dhyaan se number ${t.n} dhoondho.`;
    }
    case 'train':
      if (q.variant === 'order') return q.direction === 'asc' ? 'Pehle sabse chhota number dhoondho.' : 'Pehle sabse bada number dhoondho.';
      return Math.abs(q.step) > 1 ? `Har dabba ${Math.abs(q.step)} ${q.step > 0 ? 'badhta' : 'ghatta'} hai.` : q.step > 0 ? 'Har dabba ek zyada hai.' : 'Har dabba ek kam hai.';
    case 'pizza':
      return 'Ek-ek topping lagao aur gino. Phir sab ko saath mein gino.';
    case 'shapes':
      return {
        triangle: 'Triangle ki 3 sides aur 3 corners hote hain.',
        square: 'Square ki 4 sides hoti hain, sab barabar.',
        rectangle: 'Rectangle ki 4 sides: do lambi aur do chhoti.',
        circle: 'Circle bilkul gol hota hai, wheel jaisa.',
        oval: 'Oval gol hai par khincha hua, ande jaisa.',
        star: 'Star ke 5 points hote hain.',
      }[q.target];
    case 'pattern':
      return q.patternType === 'number' ? `Har baar number ${Math.abs(q.step)} se badalta hai.` : 'Pattern zor se bolo. Kaunsa hissa repeat ho raha hai?';
    case 'shop':
      return q.variant === 'spend' ? 'Purse mein bache coins gino.' : 'Purse ke saare coins gino.';
    case 'numberline':
      return `Jump ${q.jumps} baar dabao, har jump gino.`;
    case 'tower':
      return q.variant === 'build' ? 'Apne tower ke blocks gino.' : 'Dono towers ke blocks gino.';
    case 'choose':
      switch (q.variant) {
        case 'symbol':
          return 'Magarmach ka muh bade number ki taraf khulta hai. Barabar ho toh = lagao.';
        case 'more-group':
          return 'Dono group gino.';
        case 'measure':
          return 'Neeche wale blocks ek-ek karke gino.';
        case 'odd-one-out':
          return 'Kaunsi teen cheezein ek jaisi hain?';
        case 'routine':
          return 'Apne din ke baare mein socho.';
        case 'weight':
          return 'Socho, inko uthaoge toh kaisa lagega?';
        default:
          return 'Har ek ko dhyaan se dekho.';
      }
  }
}
