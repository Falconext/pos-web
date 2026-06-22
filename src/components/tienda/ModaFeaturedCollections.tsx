import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ModaFeaturedCollectionsProps {
  slug: string;
}

export default function ModaFeaturedCollections({ slug }: ModaFeaturedCollectionsProps) {
  const navigate = useNavigate();

  const collections = [
    {
      id: 1,
      title: "Holiday Party",
      image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800",
      query: "party"
    },
    {
      id: 2,
      title: "Trending Style",
      image: "https://images.unsplash.com/photo-1550614000-4b95d8581452?auto=format&fit=crop&q=80&w=800",
      query: "trending"
    },
    {
      id: 3,
      title: "Western Charm",
      image: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=800",
      query: "western"
    },
    {
      id: 4,
      title: "Destination Wedding",
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800",
      query: "wedding"
    }
  ];

  return (
    <section className="w-full mt-16 mb-20" style={{ fontFamily: '"Inter", sans-serif' }}>
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">
        Featured Collections
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {collections.map(collection => (
          <div 
            key={collection.id} 
            className="group cursor-pointer flex flex-col gap-3"
            onClick={() => slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/catalogo?q=${collection.query}`)}
          >
            <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden relative bg-gray-100">
              <img 
                src={collection.image} 
                alt={collection.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <h3 className="font-bold text-gray-900 text-sm md:text-base group-hover:text-gray-600 transition-colors">
              {collection.title}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}
