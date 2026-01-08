# 30 Cursor Iterations Refinement Script

This script provides a structured approach to iteratively refine the InkLine Pro app using Cursor's AI chat feature. Each iteration focuses on a specific aspect of the app for perfection.

## How to Use

1. Open Cursor chat
2. Copy one of the prompts below
3. Paste and send to Cursor
4. Review and apply changes
5. Test the changes
6. Move to next iteration

## Iteration Prompts

### Iterations 1-5: Core Functionality
1. **Generate Screen UX**: "Refine the Generate screen UX for perfection. Improve loading states, error messages, and user feedback. Add skeleton loaders and better progress indicators."
2. **History Screen Performance**: "Refine the History screen for perfection. Optimize list rendering, improve search performance, and add better empty states."
3. **Print Flow**: "Refine the print flow for perfection. Improve device discovery, add better error handling, and enhance the print preview experience."
4. **Offline Sync**: "Refine offline sync for perfection. Improve conflict resolution, add better sync indicators, and handle edge cases."
5. **Image Processing**: "Refine image processing for perfection. Optimize compression, improve thumbnail generation, and add progressive loading."

### Iterations 6-10: UI/UX Polish
6. **Dark Mode**: "Refine dark mode for perfection. Ensure all screens have proper contrast, improve color choices, and add smooth theme transitions."
7. **Animations**: "Refine animations for perfection. Add micro-interactions, improve transition animations, and ensure 60fps performance."
8. **Accessibility**: "Refine accessibility for perfection. Add missing labels, improve screen reader support, and ensure WCAG AA compliance."
9. **Typography**: "Refine typography for perfection. Improve font sizes, line heights, and ensure readability across all screens."
10. **Spacing & Layout**: "Refine spacing and layout for perfection. Improve padding, margins, and ensure consistent spacing throughout the app."

### Iterations 11-15: Performance
11. **List Performance**: "Refine list performance for perfection. Optimize FlashList usage, improve item rendering, and reduce memory usage."
12. **Image Loading**: "Refine image loading for perfection. Implement better caching, add progressive loading, and optimize memory usage."
13. **API Calls**: "Refine API calls for perfection. Add request deduplication, improve error handling, and optimize retry logic."
14. **Database Queries**: "Refine database queries for perfection. Optimize SQL queries, add proper indexing, and improve query performance."
15. **Bundle Size**: "Refine bundle size for perfection. Remove unused dependencies, optimize imports, and reduce app size."

### Iterations 16-20: Error Handling
16. **Network Errors**: "Refine network error handling for perfection. Add better error messages, implement retry logic, and improve offline detection."
17. **API Errors**: "Refine API error handling for perfection. Parse error responses, show user-friendly messages, and handle rate limits."
18. **Validation**: "Refine input validation for perfection. Add client-side validation, improve error messages, and prevent invalid submissions."
19. **Edge Cases**: "Refine edge case handling for perfection. Handle empty states, null values, and unexpected data gracefully."
20. **Error Recovery**: "Refine error recovery for perfection. Add recovery options, improve error logging, and implement fallback mechanisms."

### Iterations 21-25: Features
21. **Search Functionality**: "Refine search functionality for perfection. Add filters, improve search algorithm, and add search history."
22. **Export Options**: "Refine export options for perfection. Add more formats, improve quality options, and add batch export."
23. **Sharing**: "Refine sharing functionality for perfection. Add more share options, improve share preview, and add custom messages."
24. **Print Options**: "Refine print options for perfection. Add print preview, improve print settings, and add print history."
25. **History Management**: "Refine history management for perfection. Add bulk actions, improve organization, and add favorites."

### Iterations 26-30: Polish & Final Touches
26. **Loading States**: "Refine loading states for perfection. Add skeleton screens, improve progress indicators, and add better feedback."
27. **Empty States**: "Refine empty states for perfection. Add helpful illustrations, improve messaging, and add action buttons."
28. **Onboarding**: "Refine onboarding for perfection. Improve first-time user experience, add tooltips, and improve tutorials."
29. **Settings**: "Refine settings for perfection. Organize settings better, add more options, and improve settings UI."
30. **Final Polish**: "Refine the entire app for perfection. Review all screens, fix any remaining issues, and ensure everything works flawlessly."

## Custom Iteration Template

For custom refinements, use this template:

```
Refine [FEATURE/SCREEN/COMPONENT] for perfection. 
[SPECIFIC AREAS TO FOCUS ON]. 
[EXPECTED OUTCOMES].
```

Example:
```
Refine the Generate screen for perfection. 
Focus on improving the image picker UX, adding better validation feedback, and optimizing the generation flow. 
Expected outcomes: smoother user experience, fewer errors, and faster generation times.
```

## Testing After Each Iteration

After applying changes from each iteration:

1. **Manual Testing**
   - Test the specific feature/screen
   - Check for regressions
   - Verify performance

2. **Automated Testing**
   ```bash
   npm test
   ```

3. **Code Review**
   - Review changes
   - Check for best practices
   - Ensure consistency

4. **Documentation**
   - Update relevant docs
   - Note any breaking changes
   - Update changelog

## Progress Tracking

Track your progress:

- [ ] Iteration 1: Generate Screen UX
- [ ] Iteration 2: History Screen Performance
- [ ] Iteration 3: Print Flow
- [ ] Iteration 4: Offline Sync
- [ ] Iteration 5: Image Processing
- [ ] Iteration 6: Dark Mode
- [ ] Iteration 7: Animations
- [ ] Iteration 8: Accessibility
- [ ] Iteration 9: Typography
- [ ] Iteration 10: Spacing & Layout
- [ ] Iteration 11: List Performance
- [ ] Iteration 12: Image Loading
- [ ] Iteration 13: API Calls
- [ ] Iteration 14: Database Queries
- [ ] Iteration 15: Bundle Size
- [ ] Iteration 16: Network Errors
- [ ] Iteration 17: API Errors
- [ ] Iteration 18: Validation
- [ ] Iteration 19: Edge Cases
- [ ] Iteration 20: Error Recovery
- [ ] Iteration 21: Search Functionality
- [ ] Iteration 22: Export Options
- [ ] Iteration 23: Sharing
- [ ] Iteration 24: Print Options
- [ ] Iteration 25: History Management
- [ ] Iteration 26: Loading States
- [ ] Iteration 27: Empty States
- [ ] Iteration 28: Onboarding
- [ ] Iteration 29: Settings
- [ ] Iteration 30: Final Polish

## Tips

- Don't rush through iterations
- Test thoroughly after each change
- Keep a changelog
- Commit after each successful iteration
- Review and refactor as needed
- Get user feedback when possible
