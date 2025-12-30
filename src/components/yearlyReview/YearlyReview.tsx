import React, { useState, useEffect } from 'react';
import { fetchYearlyReviewData, type YearlyReviewData } from '../../lib/yearlyReview';
import { Loader2 } from 'lucide-react';
import { IntroSlide } from './slides/IntroSlide';
import { ExerciseSlide } from './slides/ExerciseSlide';
import { ReadingSlide } from './slides/ReadingSlide';
import { DuolingoSlide } from './slides/DuolingoSlide';
import { MediaOverviewSlide } from './slides/MediaOverviewSlide';
import { MovieSlide } from './slides/MovieSlide';
import { TvSlide } from './slides/TvSlide';
import { GameSlide } from './slides/GameSlide';
import { AnimeSlide } from './slides/AnimeSlide';
import { PodcastSlide } from './slides/PodcastSlide';
import { TopPicksSlide } from './slides/TopPicksSlide';
import { SummarySlide } from './slides/SummarySlide';

interface YearlyReviewProps {
    year: number;
}

export const YearlyReview: React.FC<YearlyReviewProps> = ({ year }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<YearlyReviewData | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchYearlyReviewData(year);
                setData(result);
            } catch (error) {
                console.error('Failed to load yearly review data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [year]);

    if (loading) {
        return (
            <div className="w-full h-screen bg-black flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full animate-pulse"></div>
                    <Loader2 className="animate-spin text-teal-400 w-12 h-12 relative z-10" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-white/40 text-sm tracking-widest uppercase">
                        Loading Memories...
                    </p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full h-screen bg-black flex flex-col items-center justify-center space-y-6 text-white p-8">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-red-400">Connection Interrupted</h2>
                    <p className="text-white/60 max-w-md">
                        Unable to retrieve your yearly review data. This is usually because you are not logged in.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <a href="/admin" className="px-6 py-2 bg-teal-600 rounded-full hover:bg-teal-700 transition-colors font-medium">
                            Log In / Admin
                        </a>
                        <button onClick={() => window.location.reload()} className="px-6 py-2 border border-white/20 rounded-full hover:bg-white/10 transition-colors">
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop/Mobile Container Layout
    return (
        <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden">

            {/* 1. Desktop Background (Aurora Effect) */}
            <div className="absolute inset-0 hidden md:block opacity-40 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/40 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-900/30 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            </div>

            {/* 2. Main Phone Container 
                - Mobile: Full width/height
                - Desktop: Fixed 430px width (iPhone Pro Max roughly)
            */}
            <div
                className="w-full h-full md:rounded-[40px] md:border-[8px] md:border-[#1a1a1a] md:shadow-2xl overflow-hidden relative bg-black transform transition-all duration-300 md:my-8"
                style={{
                    maxWidth: '430px',
                    height: '100%',
                    maxHeight: '932px', // iPhone 14 Pro Max height
                }}
            >
                {/* 3. Snap Scroller */}
                <div className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">

                    {/* Slide 1: Intro */}
                    <IntroSlide year={year} />

                    {/* Content Slides */}
                    {data && (
                        <>
                            {/* Habits - Swapped Reading/Duolingo order */}
                            <ExerciseSlide data={data.habits.exercise} />
                            <DuolingoSlide data={data.habits.duolingo} />
                            <ReadingSlide data={data.habits.reading} books={data.media.books.items} />

                            {/* Media - Overview */}
                            <MediaOverviewSlide media={data.media} />

                            {/* Detailed Media Slides - Render only if exists */}
                            {data.media.movies.total > 0 && <MovieSlide data={data.media.movies} />}
                            {data.media.tvShows.total > 0 && <TvSlide data={data.media.tvShows} />}
                            {data.media.anime.total > 0 && <AnimeSlide data={data.media.anime} />}
                            {data.media.games.total > 0 && <GameSlide data={data.media.games} />}
                            {data.media.podcasts.total > 0 && <PodcastSlide data={data.media.podcasts} />}

                            {/* Summary */}
                            <TopPicksSlide media={data.media} />
                            <SummarySlide data={data} />
                        </>
                    )}

                </div>
            </div>

            {/* Desktop Hint */}
            <div className="hidden md:block absolute right-12 top-1/2 transform -translate-y-1/2 space-y-4">
                <div className="text-white/20 text-xs tracking-widest uppercase rotate-90 origin-right whitespace-nowrap">
                    Scroll to Navigate
                </div>
            </div>
        </div>
    );
};
