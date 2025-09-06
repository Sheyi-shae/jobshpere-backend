// import axios from "axios";

// const HF_API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/sentence-similarity";
// const HF_TOKEN = process.env.HUGGINGFACE_API_KEY; // Make sure this matches your .env

// async function calculateSimilarity(sourceSentence, targetSentence) {
  
//   try {
//     const response = await axios.post(
//       HF_API_URL,
//       {
//         inputs: {
//           source_sentence: sourceSentence,
//           sentences: [targetSentence] // Note: Must be an array
//         }
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${HF_TOKEN}`,
//           "Content-Type": "application/json"
//         },
//         timeout: 10000
//       }
//     );

//     if (!response.data || !Array.isArray(response.data)) {
//       throw new Error("Invalid response format");
//     }

//     // The API returns similarity scores for each comparison
//     return response.data[0]; // Score between source_sentence and first sentence in array
//   } catch (error) {
//     console.error("Similarity API Error:", {
//       status: error.response?.status,
//       message: error.message,
//       data: error.response?.data
//     });
//     throw new Error(`Similarity calculation failed: ${error.message}`);
//   }
// }

// export async function scoreResumeAgainstJD(resumeText, jobDescription) {
//   // Truncate texts to avoid hitting token limits
//   const cleanText = (text) => text.trim().substring(0, 2000);
//   const resumeSummary = cleanText(resumeText);
//   const jdSummary = cleanText(jobDescription);

 
//   try {
//     const similarityScore = await calculateSimilarity(resumeSummary, jdSummary);
//     const score = Math.round(similarityScore * 100);

//     return {
//       score,
//       explanation: generateExplanation(score),
//       details: {
//         model: "all-MiniLM-L6-v2",
//         resumeLength: resumeText.length,
//         jdLength: jobDescription.length
//       }
//     };
//   } catch (error) {
//     console.error("Scoring Error:", error);
//     return {
//       score: 0,
//       explanation: "Error in scoring process",
//       error: error.message
//     };
//   }
// }

// function generateExplanation(score) {
//   if (score >= 75) return "Excellent match with job requirements";
//   if (score >= 50) return "Good potential match";
//   if (score >= 30) return "Some relevant skills";
//   return "Limited match with requirements";
// }

import axios from 'axios';

const COHERE_API_KEY = process.env.COHERE_API_KEY || "your-cohere-api-key-here";

// Cosine similarity function
function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }
  
  return dotProduct / (norm1 * norm2);
}

// Using Axios (simple and reliable)
async function calculateCohereSimilarity(text1, text2) {
  try {
    //console.log("Calculating Cohere similarity...");
    
    const response = await axios.post(
      'https://api.cohere.ai/v1/embed',
      {
        model: 'embed-english-v3.0',
        texts: [text1, text2],
        input_type: 'search_document'
      },
      {
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    if (!response.data || !response.data.embeddings) {
      throw new Error('Invalid response from Cohere API');
    }

    const embeddings = response.data.embeddings;
    
    if (embeddings.length < 2) {
      throw new Error('Not enough embeddings returned');
    }

    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
    //console.log("Cohere similarity score:", similarity);
    
    return similarity;

  } catch (error) {
    // console.error('Cohere API error:', {
    //   message: error.message,
    //   status: error.response?.status,
    //   data: error.response?.data
    // });
    //throw new Error(`Cohere similarity failed: ${error.message}`);
  }
}



// Fallback local similarity
function calculateLocalSimilarity(text1, text2) {
  if (!text1 || !text2) return 0.3;

  const clean = (text) => text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const words1 = clean(text1).split(' ').filter(word => word.length > 3);
  const words2 = clean(text2).split(' ').filter(word => word.length > 3);

  if (words1.length === 0 || words2.length === 0) return 0.3;

  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  const jaccard = intersection.size / union.size;
  return Math.max(0.1, Math.min(0.9, jaccard * 1.2));
}

export async function scoreResumeAgainstJD(resumeText, jobDescription) {
  const cleanText = (text) => {
    if (!text) return "";
    return text.trim().substring(0, 5000); 
  };

  const resumeSummary = cleanText(resumeText);
  const jdSummary = cleanText(jobDescription);

 

  try {
    let similarityScore;
    let method = 'cohere';
    
    try {
      similarityScore = await calculateCohereSimilarity(resumeSummary, jdSummary);
    } catch (cohereError) {
      //console.warn("Cohere failed, trying SDK approach...");
      
    }

    const score = Math.round(similarityScore * 100);

    return {
      score,
      explanation: generateExplanation(score),
      details: {
        provider: 'cohere',
        model: 'embed-english-v3.0',
        resumeLength: resumeText?.length || 0,
        jdLength: jobDescription?.length || 0,
        method: 'api'
      }
    };

  } catch (error) {
    //console.error("Cohere scoring failed, using local fallback:", error.message);
    
    const fallbackScore = calculateLocalSimilarity(resumeSummary, jdSummary);
    const score = Math.round(fallbackScore * 100);

    return {
      score,
      explanation: generateExplanation(score) ,
      details: {
        provider: 'local',
        error: error.message,
        resumeLength: resumeText?.length || 0,
        jdLength: jobDescription?.length || 0,
        method: 'fallback'
      }
    };
  }
}

function generateExplanation(score) {
  if (score >= 80) return "Excellent match with job requirements";
  if (score >= 60) return "Strong alignment with job needs";
  if (score >= 40) return "Good potential match";
  if (score >= 20) return "Some relevant skills and experience";
  return "Limited match with job requirements";
}

