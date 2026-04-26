export interface SyntaxCategories {
  nounClauses: string[]
  genitiveUses: string[]
  dativeUses: string[]
  accusativeUses: string[]
  participleUses: string[]
  infinitiveUses: string[]
  clauseTypes: string[]
}

export interface SyntaxAnnotation {
  phrase: string
  reference: string
  selectedCategory: string
  categoryGroup: keyof SyntaxCategories
}

export type SyntaxGroup = keyof SyntaxCategories
