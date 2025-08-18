import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the wineries data from the JSON file
    const dataPath = path.join(process.cwd(), 'src', 'data', 'wineries_with_children.json');
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const wineries = JSON.parse(fileContent);
    
    // Return the data as JSON
    return NextResponse.json(wineries);
  } catch (error) {
    console.error('Error reading wineries data:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to load wineries data' },
      { status: 500 }
    );
  }
}
