/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ExcuseCategory,
  DocumentType,
  IssuedDocument,
  UserStats,
  StampInfo,
  IssueMode,
} from './types';
import { INITIAL_STAMPS } from './data/excuses';
import {
  generateExcuse,
  getRandomApprovalTier,
  createIssuedDocument,
} from './utils/generator';
import {
  getAllDocuments,
  saveDocument,
  verifyStorageIntegrity,
} from './utils/db';
import {
  getUserStats,
  saveUserStats,
  recordDocumentIssuance,
  getStampsWithStatus,
  getAchievementsWithStatus,
  setApplicantNickname,
} from './utils/storage';
import { exportDocumentAsPng, exportDocumentAsPdf } from './utils/export';
import { Navbar } from './components/Navbar';
import { MainGenerator } from './components/MainGenerator';
import { DocumentPreview } from './components/DocumentPreview';
import { DocumentArchive } from './components/DocumentArchive';
import { StampBook } from './components/StampBook';
import { TodayExcuseModal } from './components/TodayExcuseModal';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<'issue' | 'archive' | 'stamps'>('issue');
  const [issueMode, setIssueMode] = useState<IssueMode>('quick');
  const [currentCategory, setCurrentCategory] = useState<ExcuseCategory>('daily');
  const [situation, setSituation] = useState('아침에 이불과의 중력 가속도가 5배 증가하여 기상 실패');
  const [applicant, setApplicant] = useState('김핑계');
  const [documentType, setDocumentType] = useState<DocumentType>('official_statement');
  const [selectedStampId, setSelectedStampId] = useState('stamp_default');
  const [userStats, setUserStats] = useState<UserStats>(getUserStats());
  const [documents, setDocuments] = useState<IssuedDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<IssuedDocument | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isTodayModalOpen, setIsTodayModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const documentRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stats = getUserStats();
    setUserStats(stats);
    if (stats.nickname) {
      setApplicant(stats.nickname);
    }

    const loadHistory = async () => {
      try {
        await verifyStorageIntegrity();
        const storedDocs = await getAllDocuments();
        setDocuments(storedDocs);

        if (storedDocs.length > 0) {
          const latest = storedDocs[0];
          setCurrentDocument(latest);
          setCurrentCategory(latest.category);
          setSituation(latest.situation);
          setDocumentType(latest.documentType);
          setIssueMode(latest.issueMode || 'quick');
          setSelectedStampId(latest.stampId);
          setApplicant(latest.applicant);
        } else {
          // Generate initial preview sample so user sees an immediate result
          const initialExcuse = generateExcuse('daily', '아침에 이불과의 중력 가속도가 5배 증가하여 기상 실패');
          const sampleDoc = createIssuedDocument({
            applicant: stats.nickname || '김핑계',
            category: 'daily',
            situation: '아침에 이불과의 중력 가속도가 5배 증가하여 기상 실패',
            excuse: initialExcuse,
            documentType: 'official_statement',
            issueMode: 'quick',
            approvalTier: '범정부적 전원일치 승인 [초특급]',
            stampId: 'stamp_default',
            totalIssuedSoFar: 0,
          });
          setCurrentDocument(sampleDoc);
        }
      } catch (err) {
        console.warn('Initial load error:', err);
      }
    };

    loadHistory();
  }, []);

  const refreshDocuments = async () => {
    const stored = await getAllDocuments();
    setDocuments(stored);
    const updatedStats = getUserStats();
    setUserStats(updatedStats);
  };

  const handleApplicantChange = (name: string) => {
    setApplicant(name);
    setApplicantNickname(name);
    const updated = getUserStats();
    setUserStats(updated);
    if (currentDocument) {
      setCurrentDocument({ ...currentDocument, applicant: name.trim() || '익명의 시민' });
    }
  };

  const handleDocumentTypeChange = (dt: DocumentType) => {
    setDocumentType(dt);
    if (currentDocument) {
      setCurrentDocument({ ...currentDocument, documentType: dt });
    }
  };

  const handleIssueModeChange = (mode: IssueMode) => {
    setIssueMode(mode);
    if (currentDocument) {
      setCurrentDocument({ ...currentDocument, issueMode: mode });
    }
  };

  const handleStampChange = (stampId: string) => {
    setSelectedStampId(stampId);
    if (currentDocument) {
      const stamp = INITIAL_STAMPS.find((s) => s.id === stampId) || INITIAL_STAMPS[0];
      setCurrentDocument({
        ...currentDocument,
        stampId: stamp.id,
        stampName: stamp.name,
        stampSealText: stamp.sealText,
      });
    }
  };

  // Issue a brand-new official document
  const handleIssueNewDocument = async () => {
    try {
      const excuse = generateExcuse(currentCategory, situation);
      const approvalTier = getRandomApprovalTier();

      const newDoc = createIssuedDocument({
        applicant,
        category: currentCategory,
        situation,
        excuse,
        documentType,
        issueMode,
        approvalTier,
        stampId: selectedStampId,
        totalIssuedSoFar: userStats.totalIssued,
      });

      await saveDocument(newDoc);

      const { newStats, newlyUnlockedStamps, newlyUnlockedAchievements } = recordDocumentIssuance(
        currentCategory,
        documentType
      );

      setUserStats(newStats);
      setCurrentDocument(newDoc);
      await refreshDocuments();

      // Smooth scroll on mobile to the preview
      if (window.innerWidth < 1024 && previewContainerRef.current) {
        previewContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (newlyUnlockedStamps.length > 0 || newlyUnlockedAchievements.length > 0) {
        const stampMsg = newlyUnlockedStamps.map((s) => `[${s.name}]`).join(', ');
        const achMsg = newlyUnlockedAchievements.map((a) => `[${a.title}]`).join(', ');

        setNotification({
          type: 'success',
          title: '★ 새로운 행정 권한 해금! ★',
          message: `${stampMsg ? `새 직인: ${stampMsg} ` : ''}${achMsg ? `신규 업적: ${achMsg}` : ''}`,
        });

        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#f59e0b', '#8b5cf6', '#10b981'],
        });
      } else {
        setNotification({
          type: 'success',
          title: '공식 핑계 공문 발급 완료',
          message: `발급번호: ${newDoc.issueNumber}`,
        });
      }

      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      console.error('Document issuance failed', err);
      setNotification({
        type: 'error',
        title: '발급 오류',
        message: '문서 생성 중 문제가 발생했습니다.',
      });
    }
  };

  // Regenerate excuse for current document
  const handleRegenerateExcuse = async () => {
    if (!currentDocument) return;
    try {
      const newExcuse = generateExcuse(currentCategory, situation, true);
      const updatedDoc: IssuedDocument = {
        ...currentDocument,
        excuse: newExcuse,
      };

      await saveDocument(updatedDoc);
      setCurrentDocument(updatedDoc);
      await refreshDocuments();

      setNotification({
        type: 'info',
        title: '새로운 핑계로 갱신 완료',
        message: '새로운 원인과 의결 문구로 재심의되었습니다.',
      });
      setTimeout(() => setNotification(null), 2500);
    } catch (err) {
      console.error('Regenerate failed', err);
    }
  };

  // PNG Export
  const handleExportPng = async () => {
    if (!documentRef.current || !currentDocument) return;
    try {
      setIsExporting(true);
      const filename = `핑계공문_${currentDocument.issueNumber}.png`;
      await exportDocumentAsPng(documentRef.current, filename);
      setNotification({
        type: 'success',
        title: '이미지 저장 완료',
        message: `${filename} 파일로 다운로드되었습니다.`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: '저장 실패',
        message: err?.message || '이미지 저장에 실패했습니다.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export
  const handleExportPdf = async () => {
    if (!documentRef.current || !currentDocument) return;
    try {
      setIsExporting(true);
      const filename = `핑계공문_${currentDocument.issueNumber}.pdf`;
      await exportDocumentAsPdf(documentRef.current, filename);
      setNotification({
        type: 'success',
        title: 'PDF 저장 완료',
        message: `${filename} 파일로 다운로드되었습니다.`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'PDF 저장 실패',
        message: err?.message || 'PDF 저장에 실패했습니다.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectArchivedDocument = (doc: IssuedDocument) => {
    setCurrentDocument(doc);
    setCurrentCategory(doc.category);
    setSituation(doc.situation);
    setApplicant(doc.applicant);
    setDocumentType(doc.documentType);
    setIssueMode(doc.issueMode || 'quick');
    setSelectedStampId(doc.stampId);
    setActiveTab('issue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdoptTodayExcuse = (cat: ExcuseCategory, sitText: string) => {
    setCurrentCategory(cat);
    setSituation(sitText);
    setActiveTab('issue');
  };

  const unlockedStamps = getStampsWithStatus(userStats);
  const achievements = getAchievementsWithStatus(userStats);

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-stone-800 flex flex-col font-sans selection:bg-red-200 selection:text-red-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        documentCount={documents.length}
        unlockedStampsCount={unlockedStamps.filter((s) => s.isUnlocked).length}
        totalStampsCount={unlockedStamps.length}
        applicant={applicant}
        onOpenTodayModal={() => setIsTodayModalOpen(true)}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-2 duration-200 shadow-xl px-2 sm:px-0">
          <div
            className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
              notification.type === 'success'
                ? 'bg-stone-900 text-stone-50 border-stone-800'
                : notification.type === 'info'
                ? 'bg-indigo-950 text-indigo-50 border-indigo-900'
                : 'bg-red-950 text-red-50 border-red-900'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : notification.type === 'info' ? (
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{notification.title}</p>
              <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                {notification.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-xs text-stone-400 hover:text-stone-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* TAB 1: ISSUE / GENERATOR & DOCUMENT PREVIEW */}
        {activeTab === 'issue' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Clean Editorial Hero Header */}
            <div className="text-center max-w-xl mx-auto space-y-1.5 pt-2 pb-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                공식 핑계 발급소
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-sans">
                일상의 사소한 곤란함을 과하게 진지한 가상 행정 공문으로 결재해 드립니다.
              </p>
            </div>

            {/* Split Layout: Generator Input (Left) + Live Document Preview (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Input Form */}
              <div className="lg:col-span-5 space-y-4">
                <MainGenerator
                  currentCategory={currentCategory}
                  onCategoryChange={setCurrentCategory}
                  situation={situation}
                  onSituationChange={setSituation}
                  applicant={applicant}
                  onApplicantChange={handleApplicantChange}
                  documentType={documentType}
                  onDocumentTypeChange={handleDocumentTypeChange}
                  issueMode={issueMode}
                  onIssueModeChange={handleIssueModeChange}
                  selectedStampId={selectedStampId}
                  onStampChange={handleStampChange}
                  unlockedStamps={unlockedStamps}
                  userStats={userStats}
                  currentDocument={currentDocument}
                  onIssueNewDocument={handleIssueNewDocument}
                  onRegenerateExcuse={handleRegenerateExcuse}
                  onExportPng={handleExportPng}
                  onExportPdf={handleExportPdf}
                  isExporting={isExporting}
                />
              </div>

              {/* Right Column: Live Document Preview */}
              <div ref={previewContainerRef} className="lg:col-span-7">
                <div className="lg:sticky lg:top-24 space-y-3">
                  {currentDocument ? (
                    <DocumentPreview
                      ref={documentRef}
                      document={currentDocument}
                      onModeChange={handleIssueModeChange}
                      onExportPng={handleExportPng}
                      onExportPdf={handleExportPdf}
                      onRegenerate={handleRegenerateExcuse}
                      isExporting={isExporting}
                    />
                  ) : (
                    <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
                      <FileText className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-stone-700">발급된 문서가 없습니다</p>
                      <p className="text-xs text-stone-500 mt-1">
                        왼쪽에서 상황을 입력하고 공식 핑계 공문을 발급해 보세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENT ARCHIVE */}
        {activeTab === 'archive' && (
          <DocumentArchive
            documents={documents}
            onRefresh={refreshDocuments}
            onSelectDocument={handleSelectArchivedDocument}
            onExportDocPng={handleExportPng}
            onExportDocPdf={handleExportPdf}
          />
        )}

        {/* TAB 3: STAMP BOOK & ACHIEVEMENTS */}
        {activeTab === 'stamps' && (
          <StampBook
            userStats={userStats}
            stamps={unlockedStamps}
            achievements={achievements}
            onSelectStampToUse={(id) => {
              setSelectedStampId(id);
              setActiveTab('issue');
            }}
          />
        )}
      </main>

      {/* Today's Excuse Modal */}
      <TodayExcuseModal
        isOpen={isTodayModalOpen}
        onClose={() => setIsTodayModalOpen(false)}
        onAdoptExcuse={handleAdoptTodayExcuse}
      />

      {/* Clean Footer */}
      <footer className="mt-16 border-t border-stone-200 bg-[#f7f4ee] text-stone-500 text-xs py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-stone-800">ExcuseOffice</span>
            <span>·</span>
            <span className="text-red-700 font-medium">MinLab 패러디 문서 — 실제 증빙 효력 없음</span>
          </div>

          <div className="text-[11px] font-mono text-stone-400">
            100% 브라우저 로컬 구동 (IndexedDB)
          </div>
        </div>
      </footer>
    </div>
  );
}
