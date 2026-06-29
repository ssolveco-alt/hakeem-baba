"use client";

import { useParams } from "next/navigation";
import { VisitEditClient } from "./visit-edit-client";

export default function EditVisitPage() {
  const { id } = useParams<{ id: string }>();
  return <VisitEditClient id={id} />;
}
