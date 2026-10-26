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
  DocumentDetails,
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
import { applyDocumentDetails, getDefaultDocumentDetails, getDocumentDetails } from './utils/documentText';
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
  const [issueMode, setIssueMode] = useState<IssueMode>('formal');
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails>(getDefaultDocumentDetails);
  const [currentCategory, setCurrentCategory] = useState<ExcuseCategory>('daily');
  const [situation, setSituation] = useState('침대에서 나오기 싫어요.');
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
          setCurrentDocument({ ...latest, issueMode: 'formal' });
          setDocumentDetails(getDocumentDetails(latest));
          setCurrentCategory(latest.category);
          setSituation(latest.situation);
          setDocumentType(latest.documentType);
          setIssueMode('formal');
          setSelectedStampId(latest.stampId);
          setApplicant(latest.applicant);
        } else {
          // Generate initial preview sample so user sees an immediate result
          const initialExcuse = generateExcuse('daily', '침대에서 나오기 싫어요.');
          const sampleDoc = createIssuedDocument({
            applicant: stats.nickname || '김핑계',
            category: 'daily',
            situation: '침대에서 나오기 싫어요.',
            excuse: initialExcuse,
            documentType: 'official_statement',
            issueMode: 'formal',
            approvalTier: '오늘만 특별 승인',
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
    if (updatedStats.nickname !== userStats.nickname) setApplicant(updatedStats.nickname);
  };

  const handleApplicantChange = (name: string) => {
    setApplicant(name);
    setApplicantNickname(name);
    const updated = getUserStats();
    setUserStats(updated);
    if (currentDocument) {
      setCurrentDocument({ ...currentDocument, applicant: name.trim() || '이름 없는 사람' });
    }
  };

  const handleDocumentTypeChange = (dt: DocumentType) => {
    setDocumentType(dt);
    if (currentDocument) {
      setCurrentDocument({ ...currentDocument, documentType: dt });
    }
  };

  const handleDocumentDetailsChange = (details: DocumentDetails) => {
    setDocumentDetails(details);
    setCurrentDocument((doc) => doc ? applyDocumentDetails(doc, details) : doc);
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
        details: documentDetails,
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
          title: '새 도장과 기록을 얻었어요!',
          message: `${stampMsg ? `새 도장: ${stampMsg} ` : ''}${achMsg ? `새 기록: ${achMsg}` : ''}`,
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
          title: '핑계 문서를 만들었어요',
          message: `문서 번호: ${newDoc.issueNumber}`,
        });
      }

      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      console.error('Document issuance failed', err);
      setNotification({
        type: 'error',
        title: '문서를 만들지 못했어요',
        message: '잠시 뒤 다시 눌러 주세요.',
      });
    }
  };

  // Regenerate excuse for current document
  const handleRegenerateExcuse = async () => {
    if (!currentDocument) return;
    if (!situation.trim()) {
      setNotification({ type: 'error', title: '상황을 적어 주세요', message: '상황을 적거나 예시를 골라 주세요.' });
      return;
    }
    // Changed inputs and the unsaved sample become a new document, preserving the old one.
    if (currentDocument.category !== currentCategory || currentDocument.situation !== situation.trim() ||
        !documents.some((doc) => doc.id === currentDocument.id)) {
      await handleIssueNewDocument();
      return;
    }
    try {
      const newExcuse = generateExcuse(currentDocument.category, currentDocument.situation, true, currentDocument.excuse);
      const updatedDoc: IssuedDocument = {
        ...currentDocument,
        excuse: newExcuse,
      };

      await saveDocument(updatedDoc);
      setCurrentDocument(updatedDoc);
      await refreshDocuments();

      setNotification({
        type: 'info',
        title: '다른 핑계로 바꿨어요',
        message: '새 문구를 확인해 보세요.',
      });
      setTimeout(() => setNotification(null), 2500);
    } catch (err) {
      console.error('Regenerate failed', err);
      setNotification({ type: 'error', title: '핑계를 바꾸지 못했어요', message: '잠시 뒤 다시 눌러 주세요.' });
    }
  };

  // PNG Export
  const handleExportPng = async () => {
    if (!documentRef.current || !currentDocument) return;
    try {
      setIsExporting(true);
      const filename = `핑계문서_${currentDocument.issueNumber}.png`;
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
      const filename = `핑계문서_${currentDocument.issueNumber}.pdf`;
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
    setDocumentDetails(getDocumentDetails(doc));
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
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900 flex flex-col font-sans selection:bg-red-100 selection:text-red-900 pb-20 md:pb-0">
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-10">
        {/* TAB 1: ISSUE / GENERATOR & DOCUMENT PREVIEW */}
        {activeTab === 'issue' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Clean Editorial Hero Header */}
            <div className="space-y-3 pb-2 sm:pb-4">
              <p className="text-xs font-bold tracking-wide text-red-600">EXCUSE OFFICE</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                오늘의 핑계, 정식으로 승인받기
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                상황 한 줄이면 충분해요. 도장까지 찍어서 친구에게 보내보세요.
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
                  documentDetails={documentDetails}
                  onDocumentDetailsChange={handleDocumentDetailsChange}
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
                      <p className="text-sm font-bold text-stone-700">아직 만든 문서가 없어요</p>
                      <p className="text-xs text-stone-500 mt-1">
                        상황을 적고 핑계 문서를 만들어 보세요.
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
              handleStampChange(id);
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
      <footer className="mt-10 text-slate-400 text-xs py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-stone-800">ExcuseOffice</span>
            <span>·</span>
            <span>친구끼리 웃고 넘기는 핑계 한 장</span>
          </div>

          <div className="text-[11px] font-mono text-stone-400">
            내 기록은 이 브라우저에 저장돼요.
          </div>
        </div>
      </footer>
    </div>
  );
}
