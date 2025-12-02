/**
 * Copyright (C) 2025 MFitHou
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { getApiEndpoint } from '../../config/api';
import { fetchNearbyPlaces } from '../../utils/nearbyApi';
import type { NearbyPlace } from '../../utils/nearbyApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faRobot, 
  faUser, 
  faSpinner,
  faXmark,
  faMicrophone,
  faStop
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/components/MapChatbot.css';

interface SearchResult {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  displayName: string;
  description?: string;
  image?: string;
  wikidataId?: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  searchResults?: SearchResult[]; // Optional search results to display as buttons
}

interface MapChatbotProps {
  onNearbyPlacesChange?: (places: NearbyPlace[], center?: { lat: number; lon: number }, radiusKm?: number) => void;
  onLocationSelect?: (location: { lat: number; lon: number; name: string; wikidataId?: string; description?: string; type?: string; image?: string }) => void;
  externalMessage?: string | null; // New: external message to display
  onExternalMessageShown?: () => void; // Callback after message is shown
}

const MapChatbot: React.FC<MapChatbotProps> = ({ 
  onNearbyPlacesChange, 
  onLocationSelect,
  externalMessage,
  onExternalMessageShown
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: t('chatbot.mapWelcomeMessage'),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isStopping, setIsStopping] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stopStartTimeRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle external message from SmartSearch
  useEffect(() => {
    if (externalMessage) {
      const botMessage: Message = {
        id: Date.now().toString(),
        content: externalMessage,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsOpen(true); // Auto open chatbot
      
      if (onExternalMessageShown) {
        onExternalMessageShown();
      }
    }
  }, [externalMessage, onExternalMessageShown]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true; // Enable continuous recognition
      recognitionInstance.interimResults = true; // Enable interim results for real-time display
      recognitionInstance.lang = 'vi-VN'; // Vietnamese language
      recognitionInstance.maxAlternatives = 1;
      
      recognitionInstance.onstart = () => {
        console.log('[Speech] Recognition started');
        setIsListening(true);
        setIsStopping(false);
        stopStartTimeRef.current = null;
        setFinalTranscript(''); // Reset transcript when starting
      };
      
      recognitionInstance.onresult = (event: any) => {
        // Ignore results if we're in the process of stopping
        if (isStopping) {
          console.log('[Speech] Ignoring result, already stopping');
          return;
        }
        
        let interimTranscript = '';
        let finalText = '';
        
        // Process all results and accumulate final transcripts
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update final transcript state if we have new final text
        if (finalText) {
          setFinalTranscript(prev => {
            const newTranscript = prev + finalText;
            console.log('[Speech] Final transcript updated:', newTranscript.trim());
            return newTranscript;
          });
        }
        
        // Combine final and interim for display
        const displayText = finalText ? 
          (finalTranscript + finalText + interimTranscript).trim() : 
          (finalTranscript + interimTranscript).trim();
        
        setInputValue(displayText);
        
        // Reset silence timer on each speech detected
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        // Set new silence timer - stop after 2 seconds of silence
        silenceTimerRef.current = setTimeout(() => {
          stopStartTimeRef.current = Date.now();
          console.log('[Speech] 2s silence detected, stopping at:', new Date(stopStartTimeRef.current).toISOString());
          setIsStopping(true);
          if (recognitionInstance) {
            recognitionInstance.stop();
          }
        }, 2000);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('[Speech] Recognition error:', event.error);
        
        // Don't stop for no-speech error, it's normal during pauses
        if (event.error === 'no-speech') {
          console.log('[Speech] No speech detected, continuing...');
          return;
        }
        
        setIsListening(false);
        setFinalTranscript('');
        
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        let errorMsg = 'Lỗi nhận dạng giọng nói';
        if (event.error === 'not-allowed') {
          errorMsg = 'Vui lòng cho phép truy cập microphone';
        } else if (event.error === 'network') {
          errorMsg = 'Lỗi kết nối mạng';
        }
        setError(errorMsg);
      };
      
      recognitionInstance.onend = () => {
        const endTime = Date.now();
        if (stopStartTimeRef.current) {
          const duration = endTime - stopStartTimeRef.current;
          console.log('[Speech] Recognition ended at:', new Date(endTime).toISOString());
          console.log('[Speech] ⏱️ Time from stopping to ended:', duration, 'ms');
        } else {
          console.log('[Speech] Recognition ended (manual stop or error)');
        }
        
        setIsListening(false);
        setIsStopping(false);
        stopStartTimeRef.current = null;
        setFinalTranscript('');
        
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.warn('[Speech] Speech Recognition not supported');
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognition) {
      setError('Trình duyệt không hỗ trợ nhận dạng giọng nói');
      return;
    }
    
    if (isListening) {
      stopStartTimeRef.current = Date.now();
      console.log('[Speech] Manual stop at:', new Date(stopStartTimeRef.current).toISOString());
      setIsStopping(true);
      recognition.stop();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      setError(null);
      setFinalTranscript('');
      setInputValue('');
      setIsStopping(false);
      stopStartTimeRef.current = null;
      recognition.start();
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    console.log('[MapChatbot] Sending message:', inputValue.trim());

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Helper function to perform nearby search
    const performNearbySearch = async (
      searchParams: any,
      amenities: string[],
      radiusKm: number,
      scope: string,
      service: string,
      location: string
    ) => {
      // Display initial search info
      let initialText = `🔍 **Searching for public services**\n\n`;
      initialText += `📍 **Location:** ${location || 'Your current location'}\n`;
      initialText += `🏢 **Service:** ${service || amenities?.join(', ') || 'Unknown'}\n`;
      initialText += `📏 **Radius:** ${radiusKm}km${scope ? ` (${scope})` : ''}\n`;
      initialText += `\n⏳ Đang tìm kiếm...`;
      
      // Send initial message
      const initialMessageId = (Date.now() + 1).toString();
      const initialMessage: Message = {
        id: initialMessageId,
        content: initialText,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, initialMessage]);
      
      // Fetch nearby places for each amenity
      try {
        const allResults: NearbyPlace[] = [];
        
        console.log('[MapChatbot] Starting search for amenities:', searchParams.amenities);
        
        // ✅ Gọi unified API 1 lần với tất cả amenities
        console.log(`[MapChatbot] Fetching ${searchParams.amenities.length} types...`);
        const nearbyResponse = await fetchNearbyPlaces(
          searchParams.lon,
          searchParams.lat,
          searchParams.radiusKm,
          searchParams.amenities, // ✅ Truyền toàn bộ array
          true,  // includeTopology
          false, // includeIoT
          'vi'   // language
        );
        
        if (nearbyResponse && nearbyResponse.items) {
          console.log(`[MapChatbot] Found ${nearbyResponse.items.length} places`);
          allResults.push(...nearbyResponse.items);
        }
        
        console.log(`[MapChatbot] Total results: ${allResults.length}`);
        
        // Display results
        if (allResults.length > 0) {
          let resultText = `\n\n**Found ${allResults.length} results:**\n\n`;
          
          // Group by amenity type
          const groupedResults: { [key: string]: NearbyPlace[] } = {};
          allResults.forEach(place => {
            const type = place.amenity || place.highway || place.leisure || 'unknown';
            if (!groupedResults[type]) {
              groupedResults[type] = [];
            }
            groupedResults[type].push(place);
          });
          
          // Display grouped results
          Object.entries(groupedResults).forEach(([type, places]) => {
            resultText += `**${type.toUpperCase()}** (${places.length}):\n`;
            places.slice(0, 5).forEach((place, idx) => {
              const name = place.name || place.brand || `${type} ${idx + 1}`;
              const distance = place.distanceKm.toFixed(2);
              resultText += `  ${idx + 1}. ${name} - ${distance}km\n`;
            });
            if (places.length > 5) {
              resultText += `  ... and ${places.length - 5} more results\n`;
            }
            resultText += `\n`;
          });
          
          // Update the last message with results
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.findIndex(m => m.id === initialMessageId);
            if (lastIndex !== -1) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: initialText.replace('⏳ Đang tìm kiếm...', resultText)
              };
            }
            return updated;
          });
          
          // Send ALL places to parent component (Map) to display markers - ONLY ONCE
          if (onNearbyPlacesChange) {
            console.log('[MapChatbot] Sending ALL places to map:', allResults.length);
            onNearbyPlacesChange(allResults, {
              lat: searchParams.lat,
              lon: searchParams.lon
            }, searchParams.radiusKm);
          }
        } else {
          // No results found
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.findIndex(m => m.id === initialMessageId);
            if (lastIndex !== -1) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: initialText.replace('Đang tìm kiếm...', '\n\nKhông tìm thấy kết quả nào.')
              };
            }
            return updated;
          });
        }
      } catch (searchError) {
        console.error('[MapChatbot] Error fetching nearby places:', searchError);
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.findIndex(m => m.id === initialMessageId);
          if (lastIndex !== -1) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: initialText.replace('⏳ Đang tìm kiếm...', '\n\n⚠️ Có lỗi xảy ra khi tìm kiếm.')
            };
          }
          return updated;
        });
      }
    };

    try {
      const apiUrl = getApiEndpoint.chat();
      
      console.log('[MapChatbot] Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          contents: userMessage.content
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[MapChatbot] ===== Chat API Response =====');
      console.log('[MapChatbot] Full response:', JSON.stringify(data, null, 2));
      console.log('[MapChatbot] Has finalResponse:', !!data.finalResponse);
      console.log('[MapChatbot] Has functionCalls:', !!data.functionCalls);
      console.log('[MapChatbot] Has questionType:', !!data.questionType);
      console.log('[MapChatbot] =========================');
      
      // Handle Function Calling Response (PRIORITY 1)
      if (data.finalResponse && data.functionCalls && Array.isArray(data.functionCalls)) {
        console.log('[MapChatbot] ✅ Function calling response detected!');
        console.log('[MapChatbot] Number of function calls:', data.functionCalls.length);
        
        // Extract location from fetchGeocodeByName
        let location = null;
        const geocodeCall = data.functionCalls.find((call: any) => 
          call.functionName === 'fetchGeocodeByName'
        );
        
        if (geocodeCall && geocodeCall.result) {
          location = {
            lat: geocodeCall.result.lat,
            lon: geocodeCall.result.lng,
            name: geocodeCall.arguments.name
          };
          
          console.log('[MapChatbot] Location extracted:', location);
          
          // Fly to location
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        }
        
        // Extract all service items from search*Nearby functions
        const allPlaces: NearbyPlace[] = [];
        let searchResults: SearchResult[] = [];
        
        data.functionCalls.forEach((call: any) => {
          console.log(`[MapChatbot] Checking function: ${call.functionName}`);
          
          // Check if it's a nearby search function (searchXXXNearby or searchXXXsNearby)
          const isNearbySearch = call.functionName.startsWith('search') && 
                                 (call.functionName.endsWith('Nearby') || call.functionName.includes('Nearby'));
          
          if (isNearbySearch && call.result?.items) {
            console.log(`[MapChatbot] ✅ Processing ${call.functionName}, found ${call.result.items.length} items`);
            
            // Transform items to NearbyPlace format
            const places = call.result.items.map((item: any) => ({
              poi: item.poi,
              amenity: item.amenity,
              highway: item.highway,
              leisure: item.leisure,
              name: item.name || item.brand || item.operator || `${item.amenity || item.highway || item.leisure || 'Place'}`,
              brand: item.brand,
              operator: item.operator,
              access: item.access,
              fee: item.fee,
              wkt: item.wkt,
              lon: item.lon,
              lat: item.lat,
              distanceKm: item.distanceKm,
              relatedEntities: item.relatedEntities || [] // ✅ Preserve relatedEntities
            }));
            
            console.log(`[MapChatbot] Transformed ${places.length} places from ${call.functionName}`);
            console.log(`[MapChatbot] Sample place:`, places[0]);
            allPlaces.push(...places);
            
            // ✅ Extract and add related entities as separate markers
            const relatedPlaces: NearbyPlace[] = [];
            const addedPois = new Set(allPlaces.map(p => p.poi)); // Track already added POIs
            
            console.log(`[MapChatbot] Checking for related entities in ${call.result.items.length} items...`);
            call.result.items.forEach((item: any, itemIdx: number) => {
              if (item.relatedEntities && Array.isArray(item.relatedEntities)) {
                console.log(`[MapChatbot]   Item ${itemIdx} (${item.name}) has ${item.relatedEntities.length} related entities`);
                item.relatedEntities.forEach((related: any, relIdx: number) => {
                  console.log(`[MapChatbot]     Related ${relIdx}:`, {
                    poi: related.poi,
                    name: related.name,
                    lon: related.lon,
                    lat: related.lat,
                    hasCoords: !!(related.lon && related.lat),
                    alreadyAdded: addedPois.has(related.poi)
                  });
                  
                  // Only add if it has coordinates and not already added
                  if (related.lon && related.lat && !addedPois.has(related.poi)) {
                    addedPois.add(related.poi);
                    relatedPlaces.push({
                      poi: related.poi,
                      amenity: related.amenity,
                      highway: related.highway,
                      leisure: related.leisure,
                      name: related.name || 'Related Place',
                      brand: related.brand,
                      operator: related.operator,
                      wkt: related.wkt,
                      lon: related.lon,
                      lat: related.lat,
                      distanceKm: related.distanceKm || 0,
                      relatedEntities: [] // Related entities don't need nested relations
                    });
                    console.log(`[MapChatbot]       ✅ Added as marker: ${related.name}`);
                  } else {
                    console.log(`[MapChatbot]       ❌ Skipped: ${!related.lon || !related.lat ? 'missing coords' : 'already added'}`);
                  }
                });
              } else {
                console.log(`[MapChatbot]   Item ${itemIdx} (${item.name}) has NO related entities`);
              }
            });
            
            if (relatedPlaces.length > 0) {
              console.log(`[MapChatbot] ✅ Extracted ${relatedPlaces.length} related entities as markers`);
              console.log(`[MapChatbot] Related places:`, relatedPlaces.map(p => ({ name: p.name, lon: p.lon, lat: p.lat })));
              allPlaces.push(...relatedPlaces);
            } else {
              console.warn(`[MapChatbot] ⚠️ No related entities extracted!`);
            }
          }
          
          // Extract search results from searchInforByName
          if (call.functionName === 'searchInforByName' && call.result?.search_results) {
            console.log(`[MapChatbot] Processing ${call.functionName}, found ${call.result.search_results.length} results`);
            searchResults = call.result.search_results;
          }
        });
        
        console.log(`[MapChatbot] 📍 Total places extracted: ${allPlaces.length}`);
        console.log(`[MapChatbot] Places summary:`, allPlaces.map(p => ({ name: p.name, lon: p.lon, lat: p.lat })));
        
        // Send places to map for marker display - ONLY if we have places
        if (allPlaces.length > 0) {
          if (onNearbyPlacesChange) {
            console.log('[MapChatbot] ✅ Sending', allPlaces.length, 'places to map for markers');
            
            // Try to extract radius and center from function calls arguments
            let radiusKm = 1; // default
            let center = location ? { lat: location.lat, lon: location.lon } : undefined;
            
            const nearbyCall = data.functionCalls.find((call: any) => 
              call.functionName.startsWith('search') && 
              (call.functionName.endsWith('Nearby') || call.functionName.includes('Nearby'))
            );
            
            if (nearbyCall?.arguments) {
              // Extract radius
              if (nearbyCall.arguments.radiusKm) {
                radiusKm = nearbyCall.arguments.radiusKm;
              }
              // Extract center from lat/lon in arguments (for searchNearbyWithTopology)
              if (nearbyCall.arguments.lat && nearbyCall.arguments.lon) {
                center = {
                  lat: nearbyCall.arguments.lat,
                  lon: nearbyCall.arguments.lon
                };
                console.log('[MapChatbot] ✅ Extracted search center from arguments:', center);
              }
            }
            
            // Send with center and radius
            onNearbyPlacesChange(allPlaces, center, radiusKm);
          }
        } else {
          console.warn('[MapChatbot] ⚠️ No places to send to map!');
        }
        
        // Display finalResponse to user
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.finalResponse,
          isUser: false,
          timestamp: new Date(),
          searchResults: searchResults.length > 0 ? searchResults : undefined
        };

        console.log('[MapChatbot] ✅ Displaying finalResponse to user');
        if (searchResults.length > 0) {
          console.log('[MapChatbot] ✅ Including', searchResults.length, 'search results as interactive buttons');
        }
        setMessages(prev => [...prev, botMessage]);
        
        // IMPORTANT: Return early to prevent further processing
        return;
      }
      
      // Handle new backend response format with questionType (PRIORITY 2)
      let botResponseText = t('chatbot.processingError');
      
      if (data.questionType) {
        console.log('[MapChatbot] questionType detected:', data.questionType);
        
        if (data.questionType === 'public_service_search' && data.searchParams) {
          console.log('[MapChatbot] public_service_search detected!');
          console.log('[MapChatbot] searchParams:', JSON.stringify(data.searchParams, null, 2));
          
          // Handle public service search response
          const { location, service, amenities, scope, radiusKm, searchParams } = data;
          
          // Check if location is empty or coordinates are 0
          const isCurrentLocation = !location || searchParams.lat === 0 || searchParams.lon === 0;
          
          if (isCurrentLocation) {
            // Need to get current location from browser
            console.log('[MapChatbot] Location empty, requesting current location...');
            
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const currentLat = position.coords.latitude;
                  const currentLon = position.coords.longitude;
                  
                  console.log('[MapChatbot] Got current location:', currentLat, currentLon);
                  
                  // Update searchParams with current location
                  searchParams.lat = currentLat;
                  searchParams.lon = currentLon;
                  
                  // Fly to current location
                  if (onLocationSelect) {
                    console.log('[MapChatbot] Flying to current location');
                    onLocationSelect({
                      lat: currentLat,
                      lon: currentLon,
                      name: 'Vị trí hiện tại'
                    });
                  }
                  
                  // Continue with search using current location
                  await performNearbySearch(searchParams, amenities, radiusKm, scope, service, 'Vị trí hiện tại của bạn');
                },
                (error) => {
                  console.error('[MapChatbot] Geolocation error:', error);
                  
                  const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: 'Không thể lấy vị trí hiện tại. Vui lòng cho phép truy cập vị trí hoặc nhập địa điểm cụ thể.',
                    isUser: false,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, errorMessage]);
                  setIsLoading(false);
                }
              );
              
              // Return early, will continue after geolocation
              return;
            } else {
              const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: 'Trình duyệt không hỗ trợ định vị. Vui lòng nhập địa điểm cụ thể.',
                isUser: false,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
              setIsLoading(false);
              return;
            }
          }
          
          // If location is provided, fly to it
          if (onLocationSelect && searchParams.lat && searchParams.lon) {
            const locationName = location || 'Vị trí hiện tại';
            console.log('[MapChatbot] Flying to location:', locationName);
            onLocationSelect({
              lat: searchParams.lat,
              lon: searchParams.lon,
              name: locationName
            });
          }
          
          // Perform nearby search
          await performNearbySearch(searchParams, amenities, radiusKm, scope, service, location);
          
          // Return early to skip adding another message
          setIsLoading(false);
          return;
        } else if (data.questionType === 'greeting') {
          // Handle greeting response
          botResponseText = data.message || 'Hello! How can I help you today?';
        } else if (data.questionType === 'normal_question') {
          // Handle normal question
          botResponseText = data.message || 'Let me help you with that question.';
        } else {
          // Handle other questionType cases
          botResponseText = data.message || `Đã nhận diện: ${data.questionType}`;
        }
      }
      // Keep existing logic for backward compatibility
      else if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        if (firstItem.content?.parts && Array.isArray(firstItem.content.parts)) {
          const textParts = firstItem.content.parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join('\n');
          if (textParts) {
            botResponseText = textParts;
          }
        }
      } else if (data.response || data.message) {
        botResponseText = data.response || data.message;
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponseText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat API Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to chat service');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: t('chatbot.errorMessage'),
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="map-chatbot-wrapper">
      {/* Chat Window */}
      {isOpen && (
        <div className="map-chatbot-container">
          <div className="map-chatbot-header">
            <div className="map-chatbot-title">
              <FontAwesomeIcon icon={faRobot} className="map-chatbot-icon" />
              <span>{t('chatbot.aiAssistant')}</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="map-chatbot-close-btn"
              title={t('common.button.close')}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {error && (
            <div className="map-chatbot-error">
              <FontAwesomeIcon icon={faXmark} />
              <span>{error}</span>
              <button onClick={() => setError(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          <div className="map-chatbot-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`map-message ${message.isUser ? 'map-user-message' : 'map-bot-message'}`}
              >
                <div className="map-message-avatar">
                  <FontAwesomeIcon 
                    icon={message.isUser ? faUser : faRobot} 
                  />
                </div>
                <div className="map-message-content">
                  <div className="map-message-text">
                    {message.isUser ? (
                      message.content
                    ) : (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    )}
                  </div>
                  
                  {/* Display search results as interactive buttons */}
                  {message.searchResults && message.searchResults.length > 0 && (
                    <div className="search-results-buttons">
                      {message.searchResults.map((result) => (
                        <button
                          key={result.id}
                          className="search-result-btn"
                          onClick={() => {
                            console.log('[MapChatbot] User clicked on search result:', result.name);
                            if (onLocationSelect) {
                              onLocationSelect({
                                lat: result.lat,
                                lon: result.lon,
                                name: result.displayName || result.name,
                                wikidataId: result.wikidataId,
                                description: result.description,
                                type: result.type,
                                image: result.image
                              });
                            }
                          }}
                          title={result.description || result.type}
                        >
                          <div className="search-result-btn-content">
                            <span className="search-result-name">{result.name}</span>
                            {result.type && (
                              <span className="search-result-type">{result.type}</span>
                            )}
                            {result.description && (
                              <span className="search-result-desc">{result.description}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="map-message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="map-message map-bot-message">
                <div className="map-message-avatar">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <div className="map-message-content">
                  <div className="map-message-text map-typing-indicator">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>{t('chatbot.thinking')}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="map-chatbot-input-container">
            <button 
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`map-voice-btn ${isListening ? 'listening' : ''}`}
              title={isListening ? t('chatbot.stopListening') : t('chatbot.startListening')}
            >
              <FontAwesomeIcon icon={isListening ? faStop : faMicrophone} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chatbot.mapInputPlaceholder')}
              disabled={isLoading}
              className="map-chatbot-input"
            />
            <button 
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="map-send-btn"
              title={t('chatbot.sendButton')}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button - Only show when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="map-chatbot-toggle"
          title={t('chatbot.openAiAssistant')}
        >
          <FontAwesomeIcon icon={faRobot} />
          {messages.length > 1 && (
            <span className="map-chatbot-badge">{messages.length - 1}</span>
          )}
        </button>
      )}
    </div>
  );
};

export default MapChatbot;
