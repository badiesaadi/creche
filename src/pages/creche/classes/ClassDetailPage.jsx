import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockClasses } from "../../../data/mockClasses.js";
import { mockChildren } from "../../../data/mockChildren.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";

const tabs = ["children", "attendance", "evaluations"];

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [activeTab, setActiveTab] = useState(isManager ? "children" : "attendance");

  const classData = mockClasses.find((c) => String(c.id) === id);
  const [assignedIds, setAssignedIds] = useState(classData?.enfantIds || []);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Attendance state — today's roll call
  const today = new Date().toISOString().slice(0, 10);
  const [attendance, setAttendance] = useState(() =>
    (classData?.enfantIds || []).reduce((acc, cid) => ({ ...acc, [cid]: "present" }), {})
  );
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Evaluations state
  const [evaluations, setEvaluations] = useState([]);
  const [evalForm, setEvalForm] = useState({ childId: "", domaine: "", note: "", date: today });
  const [showEvalForm, setShowEvalForm] = useState(false);

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("classes.notFound")}</p>
        <button onClick={() => navigate("/creche/classes")} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

  const assignedChildren = mockChildren.filter((c) => assignedIds.includes(c.id));
  const unassignedChildren = mockChildren.filter((c) => !assignedIds.includes(c.id) && c.statut === "actif");
  const count = assignedIds.length;
  const isOverThreshold = count > classData.seuilMax;
  const isNearFull = count >= classData.seuilMax * 0.85 && !isOverThreshold;

  function handleAddChild(childId) {
    setAssignedIds((prev) => [...prev, childId]);
    setAttendance((prev) => ({ ...prev, [childId]: "present" }));
  }
  function handleRemoveChild(childId) {
    setAssignedIds((prev) => prev.filter((cid) => cid !== childId));
  }
  function toggleAttendance(childId) {
    setAttendance((prev) => ({ ...prev, [childId]: prev[childId] === "present" ? "absent" : "present" }));
    setAttendanceSaved(false);
  }
  function handleSaveAttendance() {
    // TODO: real API call -> apiClient.post(`/classes/${id}/attendance`, { date: today, attendance })
    console.log("Attendance saved (mock):", { date: today, attendance });
    setAttendanceSaved(true);
  }
  function handleAddEval(e) {
    e.preventDefault();
    if (!evalForm.childId || !evalForm.domaine.trim() || !evalForm.note.trim()) return;
    const child = assignedChildren.find((c) => String(c.id) === evalForm.childId);
    // TODO: real API call -> apiClient.post(`/evaluations`, evalForm)
    setEvaluations((prev) => [...prev, {
      id: Date.now(),
      childId: Number(evalForm.childId),
      childName: child ? `${child.prenom} ${child.nom}` : "",
      domaine: evalForm.domaine,
      note: evalForm.note,
      date: evalForm.date,
      evaluePar: user?.nom || "Enseignante",
    }]);
    setEvalForm({ childId: "", domaine: "", note: "", date: today });
    setShowEvalForm(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/creche/classes")} className="text-gray-400 hover:text-gray-600">←</button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{classData.nom}</h1>
            <p className="text-sm text-gray-500">{classData.tranche} · {classData.enseignant}</p>
          </div>
        </div>
        {isManager && (
          <button onClick={() => navigate(`/creche/classes/${id}/modifier`)}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            {t("classes.editClass")}
          </button>
        )}
      </div>

      {/* Capacity bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700 text-sm">{count}/{classData.seuilMax} {t("classes.children")}</span>
          {isOverThreshold && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">{t("classes.overThreshold")}</span>}
          {isNearFull && !isOverThreshold && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">{t("classes.nearFull")}</span>}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${isOverThreshold ? "bg-red-500" : isNearFull ? "bg-yellow-400" : "bg-teal-500"}`}
            style={{ width: `${Math.min((count / classData.seuilMax) * 100, 100)}%` }} />
        </div>
        {isOverThreshold && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">
            {t("classes.autoSplitWarning", { count, max: classData.seuilMax })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.filter(tab => isManager || tab !== "children").map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === tab ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {t(`classes.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Children tab (Manager only) */}
      {activeTab === "children" && isManager && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">{t("classes.assignedChildren")}</h2>
            <button onClick={() => setShowAddPanel((p) => !p)} className="text-sm text-teal-600 hover:underline">
              {showAddPanel ? t("common.cancel") : `+ ${t("classes.assignChild")}`}
            </button>
          </div>
          {assignedChildren.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t("classes.noChildrenAssigned")}</p>
          ) : (
            <div className="space-y-2">
              {assignedChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50">
                  <button onClick={() => navigate(`/creche/enfants/${child.id}`)} className="text-sm font-medium text-gray-800 hover:text-teal-700">
                    {child.prenom} {child.nom}
                  </button>
                  <button onClick={() => handleRemoveChild(child.id)} className="text-xs text-red-500 hover:underline">{t("classes.unassign")}</button>
                </div>
              ))}
            </div>
          )}
          {showAddPanel && (
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <h3 className="text-sm font-medium text-gray-600">{t("classes.availableChildren")}</h3>
              {unassignedChildren.length === 0 ? (
                <p className="text-sm text-gray-400">{t("classes.noAvailableChildren")}</p>
              ) : unassignedChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50">
                  <span className="text-sm text-gray-700">{child.prenom} {child.nom}</span>
                  <button onClick={() => handleAddChild(child.id)} className="text-xs text-teal-600 hover:underline">+ {t("classes.assign")}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance tab (Teacher + Manager) */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{t("classes.attendanceDate")}: <span className="font-medium text-gray-700">{today}</span></p>
            {attendanceSaved && <span className="text-xs text-green-600 font-medium">{t("classes.attendanceSaved")}</span>}
          </div>
          {assignedChildren.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">{t("classes.noChildrenAssigned")}</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {assignedChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{child.prenom} {child.nom}</p>
                    {child.optionRepas === "creche" && (
                      <p className="text-xs text-teal-600 mt-0.5">🍽 {t("children.lunchCreche")}</p>
                    )}
                  </div>
                  <button onClick={() => toggleAttendance(child.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      attendance[child.id] === "present"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}>
                    {attendance[child.id] === "present" ? t("classes.present") : t("classes.absent")}
                  </button>
                </div>
              ))}
            </div>
          )}
          {assignedChildren.length > 0 && (
            <div className="flex justify-end">
              <button onClick={handleSaveAttendance}
                className="px-5 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
                {t("classes.saveAttendance")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Evaluations tab (Teacher + Manager) */}
      {activeTab === "evaluations" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowEvalForm((p) => !p)}
              className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
              {showEvalForm ? t("common.cancel") : `+ ${t("classes.addEvaluation")}`}
            </button>
          </div>

          {showEvalForm && (
            <form onSubmit={handleAddEval} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-700">{t("classes.newEvaluation")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.fullName")}</label>
                  <select value={evalForm.childId} onChange={(e) => setEvalForm((p) => ({ ...p, childId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                    <option value="">— {t("children.selectChild")} —</option>
                    {assignedChildren.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("classes.domain")}</label>
                  <input value={evalForm.domaine} onChange={(e) => setEvalForm((p) => ({ ...p, domaine: e.target.value }))}
                    placeholder={t("classes.domainPlaceholder")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.date")}</label>
                  <input type="date" value={evalForm.date} onChange={(e) => setEvalForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("classes.evaluation")}</label>
                <textarea value={evalForm.note} onChange={(e) => setEvalForm((p) => ({ ...p, note: e.target.value }))}
                  rows={3} placeholder={t("classes.evalNotePlaceholder")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">{t("common.save")}</button>
              </div>
            </form>
          )}

          {evaluations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">{t("classes.noEvaluations")}</div>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev) => (
                <div key={ev.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800 text-sm">{ev.childName}</span>
                    <span className="text-xs text-gray-400">{ev.date}</span>
                  </div>
                  <p className="text-xs text-teal-600 mb-1">{ev.domaine}</p>
                  <p className="text-sm text-gray-600">{ev.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
