import { useState, useEffect } from 'react';
import { Save, ChevronDown, ChevronRight, Globe, Layout, Heart, MessageSquare, Star, FileText } from 'lucide-react';
import { SiteContent } from '../../types';
import * as api from '../../utils/api';
import { toast } from 'sonner';

export function SiteContentTab() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    hero: true,
    about: true,
    donation: true,
    features: true,
    testimonials: true,
    footer: true,
  });

  useEffect(() => {
    loadSiteContent();
  }, []);

  const loadSiteContent = async () => {
    setIsLoading(true);
    try {
      const siteContent = await api.getSiteContent();
      setContent(siteContent);
    } catch (error) {
      console.error('Error loading site content:', error);
      toast.error('Failed to load site content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;

    setIsSaving(true);
    try {
      await api.updateSiteContent(content);
      toast.success('Site content updated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save site content';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (field: keyof SiteContent, value: string) => {
    if (content) {
      setContent({ ...content, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-12">
        Loading site content...
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center text-gray-400 py-12">
        Failed to load site content
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title, section }: { icon: any; title: string; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center gap-4 p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-colors mb-6"
    >
      <Icon className="w-6 h-6 text-orange-400" />
      <span className="flex-1 text-left font-semibold">{title}</span>
      {expandedSections[section] ? (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );

  const TextInput = ({ label, field, value }: { label: string; field: keyof SiteContent; value: string }) => (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
      />
    </div>
  );

  const TextArea = ({ label, field, value }: { label: string; field: keyof SiteContent; value: string }) => (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors resize-none"
        rows={4}
      />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl mb-2">Site Content Manager</h2>
          <p className="text-gray-400">Edit all site content and messaging</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-900 disabled:to-orange-900 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-3"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {/* Hero Section */}
      <SectionHeader icon={Layout} title="Hero Section" section="hero" />
      {expandedSections.hero && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <TextInput label="Heading" field="heroHeading" value={content.heroHeading} />
          <TextInput label="Subheading" field="heroSubheading" value={content.heroSubheading} />
          <TextInput label="CTA Button Text" field="heroCtaText" value={content.heroCtaText} />
          <TextInput label="Hero Image Path" field="heroImagePath" value={content.heroImagePath} />
        </div>
      )}

      {/* About Page */}
      <SectionHeader icon={FileText} title="About Page" section="about" />
      {expandedSections.about && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <TextInput label="About Heading" field="aboutHeading" value={content.aboutHeading} />
          <TextArea label="About Text" field="aboutText" value={content.aboutText} />
        </div>
      )}

      {/* Donation Page */}
      <SectionHeader icon={Heart} title="Donation Page" section="donation" />
      {expandedSections.donation && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <TextInput label="Donation Heading" field="donationHeading" value={content.donationHeading} />
          <TextArea label="Donation Text" field="donationText" value={content.donationText} />
          <TextInput label="Donation URL" field="donationUrl" value={content.donationUrl} />
          <TextInput label="Donation Button Text" field="donationButtonText" value={content.donationButtonText} />
        </div>
      )}

      {/* Features Section */}
      <SectionHeader icon={Star} title="Features Section" section="features" />
      {expandedSections.features && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <h4 className="mb-6 text-orange-400">Feature 1</h4>
          <TextInput label="Feature 1 Title" field="feature1Title" value={content.feature1Title} />
          <TextInput label="Feature 1 Description" field="feature1Description" value={content.feature1Description} />

          <h4 className="mb-6 mt-8 text-orange-400">Feature 2</h4>
          <TextInput label="Feature 2 Title" field="feature2Title" value={content.feature2Title} />
          <TextInput label="Feature 2 Description" field="feature2Description" value={content.feature2Description} />

          <h4 className="mb-6 mt-8 text-orange-400">Feature 3</h4>
          <TextInput label="Feature 3 Title" field="feature3Title" value={content.feature3Title} />
          <TextInput label="Feature 3 Description" field="feature3Description" value={content.feature3Description} />
        </div>
      )}

      {/* Testimonials Section */}
      <SectionHeader icon={MessageSquare} title="Testimonials Section" section="testimonials" />
      {expandedSections.testimonials && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <TextInput label="Testimonials Heading" field="testimonialsHeading" value={content.testimonialsHeading} />
          <TextInput label="Testimonials Subheading" field="testimonialsSubheading" value={content.testimonialsSubheading} />
        </div>
      )}

      {/* Footer Section */}
      <SectionHeader icon={Globe} title="Footer" section="footer" />
      {expandedSections.footer && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <TextInput label="Brand Name" field="footerBrandName" value={content.footerBrandName} />
          <TextInput label="Brand Description" field="footerDescription" value={content.footerDescription} />
          <TextInput label="Copyright Text" field="footerCopyright" value={content.footerCopyright} />
          <TextInput label="Contact Email" field="footerContactEmail" value={content.footerContactEmail} />
          <TextInput label="Refund Policy Text" field="footerRefundPolicy" value={content.footerRefundPolicy} />
          <TextInput label="Discord URL" field="footerDiscordUrl" value={content.footerDiscordUrl} />
          <TextInput label="Discord Link Text" field="footerDiscordText" value={content.footerDiscordText} />
          <TextInput label="Donation URL" field="footerDonationUrl" value={content.footerDonationUrl} />
          <TextInput label="Donation Link Text" field="footerDonationText" value={content.footerDonationText} />
        </div>
      )}

      {/* Save Button at Bottom */}
      <div className="flex justify-center mt-12">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-12 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-900 disabled:to-orange-900 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-3 text-lg font-semibold"
        >
          <Save className="w-6 h-6" />
          <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>
    </div>
  );
}
