/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  mute?: boolean;
}

/**
 * Reusable YouTube embedded player component.
 * Ensures the YouTube iframe is exhibited completely cleanly without any
 * obstructive covers or overlays interfering with play Controls.
 */
export default function YouTubePlayer({ videoId, title = 'YouTube Video Player', autoplay = true, mute = true }: YouTubePlayerProps) {
  const queryParams = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: mute ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1'
  }).toString();

  const embedUrl = `https://www.youtube.com/embed/${videoId}?${queryParams}`;

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-850 shadow-2xl">
      <iframe
        id={`yt-player-${videoId}`}
        src={embedUrl}
        title={title}
        className="absolute top-0 left-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
