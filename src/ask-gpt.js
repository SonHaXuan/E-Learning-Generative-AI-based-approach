require("dotenv").config();
import { ChromaInstance } from "./services/chroma";
import { chat } from "./services/openai";
import _ from "lodash";
import { LLMChain } from "langchain/chains";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

import { MAX_TOKEN_QUESTION } from "./helpers/constants";
import { numTokens } from "./helpers/text";
import { getContext } from "./helpers/openai";

main();
async function main() {
  try {
    const question = "Can you summarize the paper?";
    await askQuestion(question);

    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}

async function askQuestion(question) {
  if (numTokens(question) > MAX_TOKEN_QUESTION)
    throw new Error("The question is too long");
  const similarityItems = await ChromaInstance.similaritySearch(question);

  const context = getContext(similarityItems);
  console.log(similarityItems);

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `Based on this context: \n\n\n {context} \n\n\n Answer the question below as truthfully as you can, if you don’t know the answer, say you don’t know in a sarcastic way otherwise, just answer.`
    ),
    HumanMessagePromptTemplate.fromTemplate("{question}"),
  ]);
  const chain = new LLMChain({
    prompt: chatPrompt,
    llm: chat,
  });
  const res = await chain.call({
    context,
    question,
  });

  console.log(`A: ${res.text}`);
}
