"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  useAttributionMutations,
  useAttributions,
  useSubjectMutations,
  useSubjects,
} from "../hooks";

export function ManageSubjectsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: subjects = [] } = useSubjects();
  const { data: attributions = [] } = useAttributions();
  const subj = useSubjectMutations();
  const attr = useAttributionMutations();
  const [newSubject, setNewSubject] = useState("");
  const [newAttr, setNewAttr] = useState("");

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold">Manage subjects</h2>
      </div>

      <div className="grid grid-cols-2 gap-6 p-5">
        <div className="space-y-2">
          <Label>Subjects</Label>
          {subjects.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <span>{s.name}</span>
              <button
                onClick={() => subj.remove.mutate(s.id)}
                className="text-faint hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newSubject}
              placeholder="New subject"
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <Button
              onClick={() => {
                if (newSubject.trim()) {
                  subj.create.mutate(newSubject.trim());
                  setNewSubject("");
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Attributions</Label>
          {attributions.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <span>@{a.handle}</span>
              <button
                onClick={() => attr.remove.mutate(a.id)}
                className="text-faint hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newAttr}
              placeholder="@handle"
              onChange={(e) => setNewAttr(e.target.value)}
            />
            <Button
              onClick={() => {
                if (newAttr.trim()) {
                  attr.create.mutate(newAttr.trim());
                  setNewAttr("");
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-border p-4">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
