import { CheckIcon, Code2Icon, CopyIcon, LoaderIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PROBLEMS } from "../data/problems";

function CreateSessionModal({
  isOpen,
  onClose,
  roomConfig,
  setRoomConfig,
  onCreateRoom,
  isCreating,
  createdSession,
  onGoToSession,
}) {
  const problems = Object.values(PROBLEMS);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  if (createdSession) {
    return (
      <div className="modal modal-open">
        <div className="modal-box max-w-lg text-center">
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
              <CheckIcon className="size-8 text-success" />
            </div>
            <h3 className="font-bold text-2xl mb-2">Session Created!</h3>
            <p className="text-base-content/60 mb-6">
              Share this Session ID with your candidate to invite them:
            </p>

            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-3xl font-mono font-bold tracking-[0.2em] text-primary">
                {createdSession.sid}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdSession.sid);
                  setCopied(true);
                  toast.success("Session ID copied!");
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn btn-outline btn-primary btn-sm"
              >
                {copied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="text-sm text-base-content/40 mb-6">
              Or share the direct link:
              <br />
              <span className="font-mono text-xs">
                {window.location.origin}/session/{createdSession._id}
              </span>
            </p>

            <div className="flex justify-center gap-3">
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary gap-2" onClick={onGoToSession}>
                <Code2Icon className="size-4" />
                Go to Session
              </button>
            </div>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-6">Create New Session</h3>

        <div className="space-y-8">
          {/* PROBLEM SELECTION */}
          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-semibold">Select Problem</span>
              <span className="label-text-alt text-error">*</span>
            </label>

            <select
              className="select w-full"
              value={roomConfig.problem}
              onChange={(e) => {
                const selectedProblem = problems.find((p) => p.title === e.target.value);
                setRoomConfig({
                  difficulty: selectedProblem.difficulty,
                  problem: e.target.value,
                });
              }}
            >
              <option value="" disabled>
                Choose a coding problem...
              </option>

              {problems.map((problem) => (
                <option key={problem.id} value={problem.title}>
                  {problem.title} ({problem.difficulty})
                </option>
              ))}
            </select>
          </div>

          {/* ROOM SUMMARY */}
          {roomConfig.problem && (
            <div className="alert alert-success">
              <Code2Icon className="size-5" />
              <div>
                <p className="font-semibold">Room Summary:</p>
                <p>
                  Problem: <span className="font-medium">{roomConfig.problem}</span>
                </p>
                <p>
                  Max Participants: <span className="font-medium">2 (1-on-1 session)</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn btn-primary gap-2"
            onClick={onCreateRoom}
            disabled={isCreating || !roomConfig.problem}
          >
            {isCreating ? (
              <LoaderIcon className="size-5 animate-spin" />
            ) : (
              <PlusIcon className="size-5" />
            )}

            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
export default CreateSessionModal;
