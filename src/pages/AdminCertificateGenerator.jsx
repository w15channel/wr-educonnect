import React, { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Award,
  Download,
  FileImage,
  RefreshCw,
  Save,
  Search,
  Copy,
  ClipboardPaste,
  Move,
  Lock,
  Loader2,
  CheckCircle2,
  Users,
  Bell,
  Zap,
  Sparkles,
  Star,
  BookmarkCheck,
  Palette,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import CertificateFront from '@/components/certificates/CertificateFront';
import CertificateBack from '@/components/certificates/CertificateBack';
import AcademicItemSelector from '@/components/certificates/AcademicItemSelector';
import { formatDuration, parseDurationToMinutes } from '@/lib/durationUtils';
import {
  CERTIFICATE_STYLES,
  generateCertificateBackground,
  generateSocialMediaCertificate,
  getDefaultCertificateTemplate,
  setDefaultCertificateTemplate,
  downloadCertificateImage,
} from '@/lib/generateReceiptImage';