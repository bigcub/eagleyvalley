// One retaining wall separates Eagley Way from the lower mill passage.
// Road-facing trace follows the mapped carriageway's north boundary. The earlier
// roof-relative trace created an unsupported second wall and intervening bank.
// Exact offsets remain interpreted; roof parallax is not a ground survey.
const boundary:[number,number][]=[[61.6,27.24],[74,27.74],[88.55,28.33],[99.1,27.95],[110,26.8]];
export function passageWallZ(x:number){for(let i=1;i<boundary.length;i++){const a=boundary[i-1],b=boundary[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return boundary[boundary.length-1][1]}
