import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRightIcon,
  Code2Icon,
  CrownIcon,
  KeyIcon,
  LoaderIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { getDifficultyBadgeClass } from "../lib/utils";
import { sessionApi } from "../api/sessions";

function ActiveSessions({ sessions, isLoading, isUserInSession }) {
  const navigate = useNavigate();
  const [joiningSession, setJoiningSession] = useState(null);
  const [sidInput, setSidInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleJoinClick = (session) => {
    if (isUserInSession(session)) {
      navigate(`/session/${session._id}`);
      return;
    }
    setJoiningSession(session);
    setSidInput("");
  };

  const handleVerifySid = async () => {
    if (!sidInput.trim() || !joiningSession) return;

    setIsVerifying(true);
    try {
      await sessionApi.joinSession({ id: joiningSession._id, sid: sidInput.trim().toUpperCase() });
      setJoiningSession(null);
      navigate(`/session/${joiningSession._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid session code");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div className="lg:col-span-2 card bg-base-100 border-2 border-primary/20 hover:border-primary/30 h-full">
        <div className="card-body">
          {/* HEADERS SECTION */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
                <ZapIcon className="size-5" />
              </div>
              <h2 className="text-2xl font-black">Live Sessions</h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="size-2 bg-success rounded-full" />
              <span className="text-sm font-medium text-success">{sessions.length} active</span>
            </div>
          </div>

          {/* SESSIONS LIST */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <LoaderIcon className="size-10 animate-spin text-primary" />
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session._id}
                  className="card bg-base-200 border-2 border-base-300 hover:border-primary/50"
                >
                  <div className="flex items-center justify-between gap-4 p-5">
                    {/* LEFT SIDE */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative size-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Code2Icon className="size-7 text-white" />
                        <div className="absolute -top-1 -right-1 size-4 bg-success rounded-full border-2 border-base-100" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg truncate">{session.problem}</h3>
                          <span
                            className={`badge badge-sm ${getDifficultyBadgeClass(
                              session.difficulty
                            )}`}
                          >
                            {session.difficulty.slice(0, 1).toUpperCase() +
                              session.difficulty.slice(1)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm opacity-80">
                          <div className="flex items-center gap-1.5">
                            <CrownIcon className="size-4" />
                            <span className="font-medium">{session.host?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UsersIcon className="size-4" />
                            <span className="text-xs">{session.participant ? "2/2" : "1/2"}</span>
                          </div>
                          {session.participant && !isUserInSession(session) ? (
                            <span className="badge badge-error badge-sm">FULL</span>
                          ) : (
                            <span className="badge badge-success badge-sm">OPEN</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {session.participant && !isUserInSession(session) ? (
                      <button className="btn btn-disabled btn-sm">Full</button>
                    ) : (
                      <button
                        onClick={() => handleJoinClick(session)}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        {isUserInSession(session) ? "Rejoin" : "Join"}
                        <ArrowRightIcon className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center">
                  <SparklesIcon className="w-10 h-10 text-primary/50" />
                </div>
                <p className="text-lg font-semibold opacity-70 mb-1">No active sessions</p>
                <p className="text-sm opacity-50">Be the first to create one!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SID VERIFICATION MODAL */}
      {joiningSession && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <button
              onClick={() => setJoiningSession(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <XIcon className="size-4" />
            </button>

            <div className="text-center py-2">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <KeyIcon className="size-7 text-primary" />
              </div>
              <h3 className="font-bold text-xl mb-1">Enter Session Code</h3>
              <p className="text-base-content/60 mb-2">
                Ask the host of <span className="font-semibold">{joiningSession.problem}</span> for
                the session code to join
              </p>

              <input
                type="text"
                placeholder="e.g. ABC-123-XYZ"
                value={sidInput}
                onChange={(e) => setSidInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifySid()}
                className="input input-bordered w-full mt-4 text-center text-xl font-mono tracking-widest uppercase"
                autoFocus
              />

              <div className="flex justify-center gap-3 mt-6">
                <button className="btn btn-ghost" onClick={() => setJoiningSession(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary gap-2"
                  onClick={handleVerifySid}
                  disabled={isVerifying || !sidInput.trim()}
                >
                  {isVerifying ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <ArrowRightIcon className="size-4" />
                  )}
                  Join Session
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setJoiningSession(null)}></div>
        </div>
      )}
    </>
  );
}
export default ActiveSessions;
