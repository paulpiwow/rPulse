package com.rpulse.backend.influx;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

import org.springframework.stereotype.Service;
import com.rpulse.backend.hierarchy.entity.CTag;

/** Evaluates configured algebraic and standard-deviation CTags without executing scripts. */
@Service
public class CTagEvaluator {
    public OptionalDouble evaluate(CTag ctag, Map<String, Double> values) {
        List<String> sources = sourceKeys(ctag);
        if (sources.isEmpty() || sources.stream().anyMatch(key -> !values.containsKey(key))) return OptionalDouble.empty();
        try {
            if (ctag.getCalculationType() != null
                    && ctag.getCalculationType().toLowerCase().contains("standard deviation")) {
                double mean = sources.stream().mapToDouble(values::get).average().orElseThrow();
                if (sources.size() < 2) return OptionalDouble.of(0);
                double sum = sources.stream().mapToDouble(key -> {
                    double delta = values.get(key) - mean;
                    return delta * delta;
                }).sum();
                return OptionalDouble.of(Math.sqrt(sum / (sources.size() - 1)));
            }
            if (ctag.getExpression() == null || ctag.getExpression().isBlank()) return OptionalDouble.empty();
            double result = new Parser(ctag.getExpression(), values).parse();
            return Double.isFinite(result) ? OptionalDouble.of(result) : OptionalDouble.empty();
        } catch (IllegalArgumentException | ArithmeticException exception) {
            return OptionalDouble.empty();
        }
    }

    static List<String> sourceKeys(CTag ctag) {
        if (ctag.getSourceTagIds() == null) return List.of();
        return Arrays.stream(ctag.getSourceTagIds().split(",")).map(String::trim)
                .filter(key -> !key.isEmpty()).distinct().toList();
    }

    private static final class Parser {
        private final String input;
        private final Map<String, Double> values;
        private final List<String> keys;
        private int position;
        Parser(String input, Map<String, Double> values) {
            this.input = input;
            this.values = values;
            this.keys = values.keySet().stream().sorted(Comparator.comparingInt(String::length).reversed()).toList();
        }
        double parse() {
            double value = expression();
            whitespace();
            if (position != input.length()) throw new IllegalArgumentException("unexpected token");
            return value;
        }
        private double expression() {
            double value = term();
            while (true) {
                whitespace();
                if (take('+')) value += term();
                else if (take('-')) value -= term();
                else return value;
            }
        }
        private double term() {
            double value = factor();
            while (true) {
                whitespace();
                if (take('*')) value *= factor();
                else if (take('/')) {
                    double divisor = factor();
                    if (divisor == 0) throw new ArithmeticException("division by zero");
                    value /= divisor;
                } else return value;
            }
        }
        private double factor() {
            whitespace();
            if (take('+')) return factor();
            if (take('-')) return -factor();
            if (take('(')) {
                double value = expression();
                whitespace();
                if (!take(')')) throw new IllegalArgumentException("missing parenthesis");
                return value;
            }
            for (String key : keys) {
                if (input.startsWith(key, position)) {
                    position += key.length();
                    return values.get(key);
                }
            }
            int start = position;
            while (position < input.length()) {
                char c = input.charAt(position);
                if (!(Character.isDigit(c) || c == '.' || c == 'e' || c == 'E'
                        || ((c == '+' || c == '-') && position > start
                        && (input.charAt(position - 1) == 'e' || input.charAt(position - 1) == 'E')))) break;
                position++;
            }
            if (start == position) throw new IllegalArgumentException("value expected");
            return Double.parseDouble(input.substring(start, position));
        }
        private boolean take(char expected) {
            if (position < input.length() && input.charAt(position) == expected) {
                position++;
                return true;
            }
            return false;
        }
        private void whitespace() {
            while (position < input.length() && Character.isWhitespace(input.charAt(position))) position++;
        }
    }
}
