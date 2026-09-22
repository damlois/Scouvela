import { ApifyPowered } from '@/components/home/ApifyPowered';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ReadyToSearch } from '@/components/home/ReadyToSearch';
import { SearchModes } from '@/components/home/SearchModes';
import { TrustSection } from '@/components/home/TrustSection';
import { WhyScouvela } from '@/components/home/WhyScouvela';

export function HomeContent() {
  return (
    <div>
      <Hero />
      <ApifyPowered />
      <WhyScouvela />
      <SearchModes />
      <HowItWorks />
      <TrustSection />
      <ReadyToSearch />
    </div>
  );
}
