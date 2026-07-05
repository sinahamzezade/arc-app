"use client";

import { LegalDocumentScreen } from "@/components/LegalDocumentScreen";
import { privacySections } from "@/content/legal";

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      lastUpdated="July 5, 2026"
      sections={privacySections}
    />
  );
}
