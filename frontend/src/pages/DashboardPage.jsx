import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon, CopyIcon, LoaderIcon, SearchIcon } from "lucide-react";
import toast from "react-hot-toast";
import {
  useActiveSessions,
  useCreateSession,
  useMyRecentSessions,
} from "../hooks/useSessions";
import { sessionApi } from "../api/sessions";

import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import CreateSessionModal from "../components/CreateSessionModal";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: "" });
  const [createdSession, setCreatedSession] = useState(null);
  const [joinSid, setJoinSid] = useState("");
  const [isJoiningBySid, setIsJoiningBySid] = useState(false);
  const [lastCopiedSid, setLastCopiedSid] = useState(null);

  const createSessionMutation = useCreateSession();

  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();

  const handleCreateRoom = () => {
    if (!roomConfig.problem || !roomConfig.difficulty) return;

    createSessionMutation.mutate(
      {
        problem: roomConfig.problem,
        difficulty: roomConfig.difficulty.toLowerCase(),
      },
      {
        onSuccess: (data) => {
          setCreatedSession(data.session);
        },
      }
    );
  };

  const handleJoinBySid = async () => {
    const trimmed = joinSid.trim().toUpperCase();
    if (!trimmed) return;

    setIsJoiningBySid(true);
    try {
      const data = await sessionApi.getSessionBySid(trimmed);
      navigate(`/session/${data.session._id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Session not found. Check the ID and try again."
      );
    } finally {
      setIsJoiningBySid(false);
    }
  };

  const handleGoToSession = () => {
    if (!createdSession) return;
    setShowCreateModal(false);
    setCreatedSession(null);
    navigate(`/session/${createdSession._id}`);
  };

  const activeSessions = activeSessionsData?.sessions || [];
  const myHostedSessions = activeSessions.filter((s) => s.host?.clerkId === user?.id);
  const recentSessions = recentSessionsData?.sessions || [];

  const isUserInSession = (session) => {
    if (!user.id) return false;

    return session.host?.clerkId === user.id || session.participant?.clerkId === user.id;
  };

  return (
    <>
      <div className="min-h-screen bg-base-300">
        <Navbar />
        <WelcomeSection onCreateSession={() => setShowCreateModal(true)} />

        {/* Grid layout */}
        <div className="container mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatsCards
              activeSessionsCount={activeSessions.length}
              recentSessionsCount={recentSessions.length}
            />
            <ActiveSessions
              sessions={activeSessions}
              isLoading={loadingActiveSessions}
              isUserInSession={isUserInSession}
            />
          </div>

          <div className="mt-6">
            <div className="card bg-base-100 border-2 border-base-300">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
                    <SearchIcon className="size-5" />
                  </div>
                  <h2 className="text-xl font-bold">Session Code</h2>
                </div>

                {myHostedSessions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-base-content/60 mb-3">
                      Your active sessions — share the code with your candidate:
                    </p>
                    <div className="space-y-2">
                      {myHostedSessions.map((s) => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">{s.problem}</span>
                            <span className="font-mono text-sm font-bold tracking-wider text-primary">
                              {s.sid}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(s.sid);
                              setLastCopiedSid(s.sid);
                              toast.success("Session code copied!");
                              setTimeout(() => setLastCopiedSid(null), 2000);
                            }}
                            className="btn btn-ghost btn-xs gap-1"
                          >
                            {lastCopiedSid === s.sid ? (
                              <CheckIcon className="size-3" />
                            ) : (
                              <CopyIcon className="size-3" />
                            )}
                            {lastCopiedSid === s.sid ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-base-300 pt-4">
                  <p className="text-sm text-base-content/60 mb-3">
                    Enter a code shared by an interviewer:
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="e.g. ABC-123-XYZ"
                      value={joinSid}
                      onChange={(e) => setJoinSid(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleJoinBySid()}
                      className="input input-bordered flex-1 font-mono uppercase tracking-wider"
                    />
                    <button
                      onClick={handleJoinBySid}
                      disabled={isJoiningBySid || !joinSid.trim()}
                      className="btn btn-primary gap-2"
                    >
                      {isJoiningBySid ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        <ArrowRightIcon className="size-4" />
                      )}
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
        </div>
      </div>

      {showCreateModal && (
        <CreateSessionModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreatedSession(null);
          }}
          roomConfig={roomConfig}
          setRoomConfig={setRoomConfig}
          onCreateRoom={handleCreateRoom}
          isCreating={createSessionMutation.isPending}
          createdSession={createdSession}
          onGoToSession={handleGoToSession}
        />
      )}
    </>
  );
}

export default DashboardPage;
