
import { NextRequest, NextResponse } from 'next/server';
import { helloFlow } from '../../../ai/flows/helloFlow';
import { run } from '@genkit-ai/core';

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const result = await run(helloFlow, name);
    return NextResponse.json({ result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to run flow' }, { status: 500 });
  }
}
