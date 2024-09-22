import React, { useState, useEffect, useRef } from "react";
import countries from "../data";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Translator = () => {
  const fromTextRef = useRef(null);
  const toTextRef = useRef(null);
  const exchangeIconRef = useRef(null);
  const fromSelectRef = useRef(null);
  const toSelectRef = useRef(null);

  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [fromLang, setFromLang] = useState("en-GB");
  const [toLang, setToLang] = useState("hi-IN");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Populate select options
    const selectElements = [fromSelectRef.current, toSelectRef.current];
    selectElements.forEach((selectElement, id) => {
      for (let country_code in countries) {
        let selected =
          id === 0
            ? country_code === "en-GB"
              ? "selected"
              : ""
            : country_code === "hi-IN"
            ? "selected"
            : "";
        let option = document.createElement("option");
        option.value = country_code;
        option.text = countries[country_code];
        option.selected = !!selected;
        selectElement.appendChild(option);
      }
    });
  }, []);

  useEffect(() => {
    const handleExchange = () => {
      let tempText = fromText;
      let tempLang = fromLang;
      setFromText(toText);
      setToText(tempText);
      setFromLang(toLang);
      setToLang(tempLang);
    };

    exchangeIconRef.current.addEventListener("click", handleExchange);

    return () => {
      exchangeIconRef.current.removeEventListener("click", handleExchange);
    };
  }, [fromText, toText, fromLang, toLang]);

  const translateText = (text, fromLang, toLang) => {
    if (!text) {
      setToText("");
      return;
    }
    toTextRef.current.setAttribute("placeholder", "Translating...");
    let apiUrl = `https://api.mymemory.translated.net/get?q=${text}&langpair=${fromLang}|${toLang}`;
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        setToText(data.responseData.translatedText);
        data.matches.forEach((match) => {
          if (match.id === 0) {
            setToText(match.translation);
          }
        });
        toTextRef.current.setAttribute("placeholder", "Translation");
      })
      .catch((error) => {
        console.error("Error translating text:", error);
        toTextRef.current.setAttribute("placeholder", "Translation");
      });
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const handleFromTextChange = (e) => {
    const newText = e.target.value;
    setFromText(newText);
    debouncedTranslate(newText, fromLang, toLang);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleSpeak = (text, lang) => {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = fromLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setFromText(speechResult);
      debouncedTranslate(speechResult, fromLang, toLang);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const debouncedTranslate = debounce(translateText, 500);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div>
        <h1 className="text-5xl pt-6 mt-6 flex items-center justify-center font-bold">
          Real Time Translation App
        </h1>
      </div>
      <div className="container mx-auto flex-grow p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
          <div className="text-input mb-4">
            <textarea
              spellCheck="false"
              className="from-text w-full h-40 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
              placeholder="Enter text"
              value={fromText}
              onChange={handleFromTextChange}
              ref={fromTextRef}
            ></textarea>
            <textarea
              spellCheck="false"
              readOnly
              disabled
              className="to-text w-full h-40 p-4 mt-4 rounded-lg border border-gray-300 bg-gray-100 overflow-hidden"
              placeholder="Translation"
              value={toText}
              ref={toTextRef}
            ></textarea>
          </div>
          <ul className="controls flex justify-between items-center mb-4">
            <li className="row from flex items-center">
              <div className="icons flex space-x-2 mr-4">
                <i
                  id="from"
                  className={`fas fa-microphone text-xl cursor-pointer ${
                    isListening
                      ? "text-red-600 animate-pulse"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={handleVoiceInput}
                ></i>
                <i
                  id="from"
                  className="fas fa-volume-up text-xl cursor-pointer text-gray-600 hover:text-gray-900"
                  onClick={() => handleSpeak(fromText, fromLang)}
                ></i>
                <i
                  id="from"
                  className="fas fa-copy text-xl cursor-pointer text-gray-600 hover:text-gray-900"
                  onClick={() => handleCopy(fromText)}
                ></i>
              </div>
              <select
                ref={fromSelectRef}
                className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
              ></select>
            </li>
            <li className="exchange mx-4" ref={exchangeIconRef}>
              <i className="fas fa-exchange-alt text-2xl cursor-pointer text-gray-600 hover:text-gray-900"></i>
            </li>
            <li className="row to flex items-center">
              <select
                ref={toSelectRef}
                className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
              ></select>
              <div className="icons flex space-x-2 ml-4">
                <i
                  id="to"
                  className="fas fa-volume-up text-xl cursor-pointer text-gray-600 hover:text-gray-900"
                  onClick={() => handleSpeak(toText, toLang)}
                ></i>
                <i
                  id="to"
                  className="fas fa-copy text-xl cursor-pointer text-gray-600 hover:text-gray-900"
                  onClick={() => handleCopy(toText)}
                ></i>
              </div>
            </li>
          </ul>
          <button
            className="w-full bg-black text-white p-3 rounded-lg hover:bg-blue-600 transition"
            onClick={() => translateText(fromText, fromLang, toLang)}
          >
            Translate Text
          </button>
        </div>
      </div>
      {isListening && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white p-2 rounded-lg">
          Listening...
        </div>
      )}
    </div>
  );
};

export default Translator;
