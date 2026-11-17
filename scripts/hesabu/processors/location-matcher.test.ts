import { test } from "node:test"
import assert from "node:assert/strict"
import { matchCard, Card } from "./location-matcher"
import type { ConstituencyWards } from "../lib/wards"

const WAJIR_CARDS: Card[] = [
  { name: "Wajir Town", subCounty: "Wajir East" },
  { name: "Wajir North", subCounty: "Wajir North" },
  { name: "Wajir South", subCounty: "Wajir South" },
  { name: "Wajir West", subCounty: "Wajir West" },
  { name: "Tarbaj", subCounty: "Tarbaj" },
  { name: "Eldas", subCounty: "Eldas" },
]
const WAJIR_CONS: ConstituencyWards[] = [
  { name: "Wajir North", wards: ["Gurar", "Bute", "Korondile", "Malkagufu", "Batalu", "Danaba", "Godoma"] },
  { name: "Wajir East", wards: ["Wagberi", "Township", "Barwago", "Khorof/Harar"] },
  { name: "Tarbaj", wards: ["Elben", "Sarman", "Tarbaj", "Wargadud"] },
  { name: "Wajir West", wards: ["Arbajahan", "Hadado/Athibohol", "Ademasajide", "Wagalla/Ganyure"] },
  { name: "Eldas", wards: ["Eldas", "Della", "Lakoley South/Basir", "Elnur/Tula Tula"] },
  { name: "Wajir South", wards: ["Benane", "Burder", "Dadaja Bulla", "Habasswein", "Lagboghol South", "Ibrahim Ure", "Diif"] },
]
const p = (title: string, ward?: string, summary = "") => ({ title, ward, summary })
const wajir = (proj: ReturnType<typeof p>) => matchCard(proj, WAJIR_CARDS, WAJIR_CONS, "Wajir")

test("constituency name in ward field → that card", () => {
  const r = wajir(p("Construction of borehole", "Holoke In Tarbaj"))
  assert.equal(r.cardName, "Tarbaj")
})

test("ward name → its constituency's card", () => {
  const r = wajir(p("Wargadud dispensary upgrade"))
  assert.deepEqual(r, { cardName: "Tarbaj", matchedOn: "wargadud", method: "ward" })
})

test("slash-named ward matches on either part", () => {
  assert.equal(wajir(p("Mau Mau at Wagalla water pan")).cardName, "Wajir West")
  assert.equal(wajir(p("Ganyure classroom")).cardName, "Wajir West")
})

test("card name wins over ward lookup (Wajir Town card)", () => {
  const r = wajir(p("Wajir Town drainage works"))
  assert.equal(r.cardName, "Wajir Town")
  assert.equal(r.method, "card-name")
})

test("county name alone does not match", () => {
  assert.equal(wajir(p("Wajir County fleet purchase")).cardName, null)
})

test("generic ward name 'Township' is ignored", () => {
  assert.equal(wajir(p("Sessi Township market shed")).cardName, null)
})

test("search order: ward field before title", () => {
  const r = wajir(p("Wargadud road", "Danaba"))
  assert.equal(r.cardName, "Wajir North")
})

test("summary is searched last", () => {
  assert.equal(wajir(p("Dispensary upgrade", undefined, "Located in Bute ward.")).cardName, "Wajir North")
})

test("no location → null", () => {
  assert.deepEqual(wajir(p("Supply of drugs")), { cardName: null, matchedOn: null, method: null })
})

test("names under 4 chars ignored, whole-word only (Adu vs education)", () => {
  const cards: Card[] = [{ name: "Magarini", subCounty: "Magarini" }]
  const cons: ConstituencyWards[] = [{ name: "Magarini", wards: ["Adu", "Garashi"] }]
  assert.equal(matchCard(p("Education support"), cards, cons, "Kilifi").cardName, null)
  assert.equal(matchCard(p("Adu dispensary"), cards, cons, "Kilifi").cardName, null)
  assert.equal(matchCard(p("Garashi dispensary"), cards, cons, "Kilifi").cardName, "Magarini")
})

test("constituency shared by two cards → null", () => {
  const cards: Card[] = [{ name: "Tiaty East", subCounty: "Tiaty" }, { name: "Tiaty West", subCounty: "Tiaty" }]
  const cons: ConstituencyWards[] = [{ name: "Tiaty", wards: ["Tirioko", "Kolowa"] }]
  assert.equal(matchCard(p("Tirioko water project"), cards, cons, "Baringo").cardName, null)
})

test("spacing variants: card 'Garba Tulla' matches 'Garbatulla' and vice versa", () => {
  const cards: Card[] = [{ name: "Garba Tulla", subCounty: "Merti" }, { name: "Isiolo Town", subCounty: "Isiolo" }]
  const cons: ConstituencyWards[] = [{ name: "Isiolo South", wards: ["Garbatulla", "Kinna", "Sericho"] }]
  assert.equal(matchCard(p("Garbatulla hospital"), cards, cons, "Isiolo").cardName, "Garba Tulla")
  assert.equal(matchCard(p("Garba Tulla hospital"), cards, cons, "Isiolo").cardName, "Garba Tulla")
})

test("final review: common-word IEBC ward names (Hospital, Road, Airport…) are ignored", () => {
  const cards: Card[] = [{ name: "Thika Town", subCounty: "Thika Town" }]
  const cons: ConstituencyWards[] = [{ name: "Thika Town", wards: ["Township", "Kamenu", "Hospital", "Gatuanyaga", "Ngoliba"] }]
  assert.equal(matchCard(p("Upgrade of Kiambu Level 5 Hospital"), cards, cons, "Kiambu").cardName, null)
  const kwale: ConstituencyWards[] = [{ name: "Msambweni", wards: ["Road", "Airport", "Pipeline", "Municipality", "Racecourse", "Engineer", "South"] }]
  const kc: Card[] = [{ name: "Msambweni", subCounty: "Msambweni" }]
  for (const t of ["Gravelling of access road", "Airport road", "Water pipeline", "Municipality offices", "Racecourse fencing", "Engineer's office", "South block"])
    assert.equal(matchCard(p(t), kc, kwale, "Kwale").cardName, null, t)
})

test("final review: a ward alias present in two constituencies → null (not first-wins)", () => {
  const cards: Card[] = [{ name: "Naivasha", subCounty: "Naivasha" }, { name: "Nakuru Town East", subCounty: "Nakuru Town East" }]
  const cons: ConstituencyWards[] = [
    { name: "Naivasha", wards: ["Biashara", "Hells Gate"] },
    { name: "Nakuru Town East", wards: ["Biashara", "Kivumbini"] },
  ]
  assert.deepEqual(matchCard(p("Biashara market stalls"), cards, cons, "Nakuru"), { cardName: null, matchedOn: "biashara", method: null })
})
