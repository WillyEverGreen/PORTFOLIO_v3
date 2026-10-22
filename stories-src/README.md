# Case study pages

Source for the story pages on the portfolio, starting with Clip at `/clip`.
React, Tailwind and a few React Bits and Magic UI components, built into static files
that the portfolio serves as is.

```bash
npm install
npm run dev      # local preview
npm run build    # writes the finished page to ../clip
```

- `src/App.tsx` the Clip story, one exchange per section
- `src/story/` chat bubbles, the lab PC scene and Mango
- `src/components/` React Bits and Magic UI components, copied in via the shadcn CLI
- `public/screens/` screenshots of the real app, named after what they show

After changing anything here, run `npm run build` and commit the updated `../clip` folder.
