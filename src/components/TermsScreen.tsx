"use client";

import { LegalDocumentScreen } from "@/components/LegalDocumentScreen";
import { termsSections } from "@/content/legal";

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Service"
      lastUpdated="July 5, 2026"
      sections={termsSections}
    />
  );
}
