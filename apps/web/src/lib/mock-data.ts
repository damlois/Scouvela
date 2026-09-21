import type { FundingOpportunity, ParsedSearchRequest, SearchResponse, Vendor } from '@scouvela/shared';

const MOCK_SOURCE_NAME = 'Scouvela mock dataset';
const discoveredAt = '2026-09-21T08:00:00.000Z';

const MOCK_FUNDING: FundingOpportunity[] = [
  {
    id: 'funding-boi-msme',
    title: 'Bank of Industry MSME Loan',
    provider: 'Bank of Industry',
    fundingType: 'loan',
    amount: 'Up to ₦10 million',
    eligibility: ['Registered Nigerian SME', 'Viable business plan'],
    deadline: '2026-12-31',
    status: 'active',
    location: 'Nigeria',
    description: 'Asset and working-capital finance for eligible micro, small and medium enterprises.',
    sourceUrl: 'https://www.boi.ng/',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
  },
  {
    id: 'funding-lsetf',
    title: 'Lagos State Employment Trust Fund SME Support',
    provider: 'Lagos State Employment Trust Fund',
    fundingType: 'loan',
    amount: 'Varies by product',
    eligibility: ['Lagos-based entrepreneur', 'Registered business'],
    deadline: '2026-09-30',
    status: 'closing-soon',
    location: 'Lagos',
    description: 'State-backed finance and business support for Lagos entrepreneurs.',
    sourceUrl: 'https://lsetf.ng/',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
  },
  {
    id: 'funding-tef',
    title: 'Tony Elumelu Foundation Entrepreneurship Programme',
    provider: 'Tony Elumelu Foundation',
    fundingType: 'accelerator',
    amount: 'Seed capital and training',
    eligibility: ['African entrepreneur', 'Early-stage business idea or startup'],
    deadline: '2026-11-15',
    status: 'active',
    location: 'Africa, including Nigeria',
    description: 'Training, mentoring and seed capital for African entrepreneurs.',
    sourceUrl: 'https://www.tonyelumelufoundation.org/',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
  },
  {
    id: 'funding-smedan',
    title: 'SMEDAN Conditional Grant Scheme',
    provider: 'SMEDAN',
    fundingType: 'grant',
    eligibility: ['Nano or micro enterprise', 'Nigerian citizen'],
    deadline: '2026-10-20',
    status: 'active',
    location: 'Nigeria',
    description: 'Public support programme for nano, micro and small enterprises.',
    sourceUrl: 'https://smedan.gov.ng/',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
  },
  {
    id: 'funding-youwin-closed',
    title: 'YouWin Connect (historical programme)',
    provider: 'Federal Government of Nigeria',
    fundingType: 'grant',
    status: 'expired',
    deadline: '2015-12-31',
    location: 'Nigeria',
    description: 'Included to demonstrate expired-programme handling. Not an open call.',
    sourceUrl: 'https://www.youwin.org.ng/',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
  },
];

const MOCK_VENDORS: Vendor[] = [
  {
    id: 'vendor-ikeja-stitch-studio',
    name: 'Ikeja Stitch Studio',
    category: 'tailor',
    state: 'Lagos',
    locality: 'Ikeja',
    address: 'Ikeja, Lagos',
    description: 'Sample tailor listing for frontend development.',
    sourceUrl: 'https://www.example.com/vendors/ikeja-stitch-studio',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
    verificationStatus: 'source-listed',
  },
  {
    id: 'vendor-yaba-print-house',
    name: 'Yaba Print House',
    category: 'printer',
    state: 'Lagos',
    locality: 'Yaba',
    description: 'Sample printer listing for packaging and marketing materials.',
    sourceUrl: 'https://www.example.com/vendors/yaba-print-house',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
    verificationStatus: 'source-listed',
  },
  {
    id: 'vendor-ibadan-rise-bakery',
    name: 'Ibadan Rise Bakery',
    category: 'baker',
    state: 'Oyo',
    locality: 'Ibadan',
    description: 'Sample bakery listing for local wholesale orders.',
    sourceUrl: 'https://www.example.com/vendors/ibadan-rise-bakery',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
    verificationStatus: 'unverified',
  },
  {
    id: 'vendor-aba-leatherworks',
    name: 'Aba Leatherworks',
    category: 'shoemaker',
    state: 'Abia',
    locality: 'Aba',
    description: 'Sample shoemaker listing for made-to-order footwear.',
    sourceUrl: 'https://www.example.com/vendors/aba-leatherworks',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
    verificationStatus: 'source-listed',
  },
  {
    id: 'vendor-ph-packaging-co',
    name: 'Garden City Packaging Co',
    category: 'packaging',
    state: 'Rivers',
    locality: 'Port Harcourt',
    description: 'Sample packaging vendor listing for SME product wrapping.',
    sourceUrl: 'https://www.example.com/vendors/garden-city-packaging-co',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
    verificationStatus: 'source-listed',
  },
  {
    id: 'vendor-kano-tailor-collective',
    name: 'Kano Tailor Collective',
    category: 'tailor',
    state: 'Kano',
    locality: 'Kano Municipal',
    description: 'Sample northern Nigeria tailor listing.',
    sourceUrl: 'https://www.example.com/vendors/kano-tailor-collective',
    sourceName: MOCK_SOURCE_NAME,
    discoveredAt,
    verificationStatus: 'unverified',
  },
];

function matchesText(haystack: string | undefined, needle: string | undefined): boolean {
  if (!needle) {
    return true;
  }

  return (haystack ?? '').toLowerCase().includes(needle.toLowerCase());
}

export function getMockSearchResponse(request: ParsedSearchRequest): SearchResponse {
  if (request.mode === 'funding') {
    const results = MOCK_FUNDING.filter((item) => {
      const queryHaystack = `${item.title} ${item.provider} ${item.description ?? ''}`;
      return (
        matchesText(queryHaystack, request.query) &&
        matchesText(item.location, request.state) &&
        matchesText(item.location, request.locality) &&
        matchesText(item.description, request.businessCategory) &&
        (!request.fundingType || item.fundingType === request.fundingType)
      );
    }).slice(0, request.maxResults);

    return {
      mode: 'funding',
      results,
      meta: {
        resultCount: results.length,
        usedMockData: true,
        source: 'mock',
      },
    };
  }

  const results = MOCK_VENDORS.filter((item) => {
    const queryHaystack = `${item.name} ${item.category} ${item.description ?? ''}`;
    return (
      matchesText(queryHaystack, request.query) &&
      matchesText(item.state, request.state) &&
      matchesText(item.locality, request.locality) &&
      matchesText(item.category, request.serviceCategory)
    );
  }).slice(0, request.maxResults);

  return {
    mode: 'vendors',
    results,
    meta: {
      resultCount: results.length,
      usedMockData: true,
      source: 'mock',
    },
  };
}
