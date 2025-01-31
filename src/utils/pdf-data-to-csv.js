
import pdf2img from 'pdf-img-convert';
import OpenAI from 'openai';

async function analyzePdfData() {
    const pdfPages = (await pdf2img.convert('./document.pdf', {
        height: 1998,
        base64: true,
    }));

    const imagePrompts = pdfPages.map(
        (encodedImage) =>
        ({
            type: 'image_url',
            image_url: {
                url: `data:image/png;base64,${encodedImage}`,
                detail: 'high',
            },
        })
    );

    const openai = new OpenAI({
        apiKey: 'top-secret',
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: [{ type: 'text', text: 'What are the titles on the images?' }, ...imagePrompts],
            },
        ],
    });

    console.log(response.choices[0]?.message.content);

}